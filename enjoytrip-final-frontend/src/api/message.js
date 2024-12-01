import { localAxios, authAxios } from "@/util/http-commons";

const local = localAxios();
const axios = authAxios();

async function apiMessage(body, success, fail) {
  return axios.post(`/messages`, body).then(success).catch(fail);
}

export { apiMessage };
