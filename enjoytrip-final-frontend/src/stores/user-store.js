import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    isLoggedIn: false,
    userInfo: null,
    accessToken: null,
    refreshToken: null,
  }),

  actions: {
    async setLoginInfo(data) {
      this.isLoggedIn = true;
      this.userInfo = data.userInfo;
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;

      // localStorage에도 저장
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // userInfo가 로그인 응답에 포함되어 있지 않다면 fetchUserProfile 호출

      localStorage.setItem("userInfo", JSON.stringify(data.userInfo));

      //localStorage.setItem("userInfo", JSON.stringify(data.userInfo)); // 객체는 JSON으로 변환
    },

    logout() {
      this.isLoggedIn = false;
      this.userInfo = null;
      this.accessToken = null;
      this.refreshToken = null;

      // localStorage에서도 제거
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userInfo");
    },

    // 페이지 새로고침 시 로그인 상태 복구
    initializeAuth() {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        this.isLoggedIn = true;
        this.accessToken = accessToken;
        this.refreshToken = localStorage.getItem("refreshToken");

        // userInfo 복구
        const userInfoStr = localStorage.getItem("userInfo");
        if (userInfoStr) {
          this.userInfo = JSON.parse(userInfoStr);
        }
      }
    },

    async fetchUserProfile() {
      try {
        const response = await api.get("/members/myProfile", {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
        this.userInfo = response.data;
        localStorage.setItem("userInfo", JSON.stringify(response.data));
      } catch (error) {
        console.error("프로필 정보 가져오기 실패:", error);
      }
    },
  },
});
