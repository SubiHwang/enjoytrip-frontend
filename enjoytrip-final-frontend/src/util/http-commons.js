import axios from "axios";
import router from "@/router";

const { VITE_VUE_API_URL } = import.meta.env;

const refreshAxios = axios.create({
  baseURL: VITE_VUE_API_URL,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (newToken) => {
  failedQueue.forEach(({ config, resolve, reject }) => {
    config.headers.Authorization = `Bearer ${newToken}`;
    axios(config)
      .then(response => resolve(response))
      .catch(error => reject(error));
  });
  failedQueue = [];
};

const refreshToken = async () => {
  try {
    if (isRefreshing) {
      return null;
    }

    isRefreshing = true;
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await refreshAxios.get("/member/refresh", {
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    });

    const accessToken = response.data["access-token"];
    const newRefreshToken = response.data["refresh-token"];

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    processQueue(accessToken);
    return accessToken;
  } catch (error) {
    failedQueue.forEach(({ reject }) => reject(error));
    failedQueue = [];
    throw error;
  } finally {
    isRefreshing = false;
  }
};

function localAxios() {
  return axios.create({
    baseURL: VITE_VUE_API_URL,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
}

function authAxios() {
  const instance = axios.create({
    baseURL: VITE_VUE_API_URL,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (!error.response) {
        return Promise.reject(error);
      }

      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // Promise를 생성하여 큐에 추가
          return new Promise((resolve, reject) => {
            failedQueue.push({
              config: originalRequest,
              resolve,
              reject
            });
          });
        }

        try {
          const newToken = await refreshToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/login');
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

export { localAxios, authAxios };
