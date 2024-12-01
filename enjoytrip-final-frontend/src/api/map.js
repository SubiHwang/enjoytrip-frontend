import { localAxios } from "@/util/http-commons";

const local = localAxios();

function listSido(success, fail) {
  local.get(`/trip/sido`).then(success).catch(fail);
}

function listGugun(param, success, fail) {
  local.get(`/trip/gugun`, { params: param }).then(success).catch(fail);
}

function listCategory(success, fail) {
  local.get(`/trip/category`).then(success).catch(fail);
}

function listAttraction(param, success, fail) {
  local.get(`/trip`, { params: param }).then(success).catch(fail);
}

export { listSido, listGugun, listCategory, listAttraction };
