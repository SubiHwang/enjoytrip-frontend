import { authAxios } from "@/util/http-commons";

const axios = authAxios();

async function getKeywordRankByAll() {
  return axios.get(`/graph/keyword/all`);
}

async function getKeywordRankByAge() {
  return axios.get(`/graph/keyword/age`);
}

export {
  getKeywordRankByAll,
  getKeywordRankByAge
};
