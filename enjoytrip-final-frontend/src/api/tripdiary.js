import { localAxios, authAxios } from "@/util/http-commons";

const local = localAxios();
const axios = authAxios();

async function saveTripDiary(body, success, fail) {
  return axios.post(`/trip-diary/`, body).then(success).catch(fail);
};

async function readTripDiary(diaryId, success, fail) {
  return axios.get(`/trip-diary/${diaryId}`).then(success).catch(fail);
}

async function updateTripDiary(diaryId, body, success, fail) {
  return axios.put(`/trip-diary/${diaryId}`, body).then(success).catch(fail);
}

async function deleteTripDiary(diaryId, body, success, fail) {
  return axios.delete(`/trip-diary/${diaryId}`, body).then(success).catch(fail);
}

async function setShareStatusTripDiary(diaryId, body, success, fail) {
  return axios.patch(`/trip-diary/${diaryId}/share-status`, body).then(success).catch(fail);
}

async function checkEditAuthentication(diaryId, success, fail) {
  return axios.get(`/trip-diary/${diaryId}/auth`).then(success).catch(fail);
}

async function getAllTripDiaries(success, fail) {
  return axios.get(`/trip-diary/all`).then(success).catch(fail);
}

async function getAccountTripDiary(userId, success, fail) {
  return axios.get(`/trip-diary/account/${userId}`).then(success).catch(fail);
}

async function likeTripDiaries(diaryId, success, fail) {
  return axios.post(`/trip-diary/${diaryId}/like`).then(success).catch(fail);
}

async function unlikeTripDiaries(diaryId, success, fail) {
  return axios.delete(`/trip-diary/${diaryId}/like`).then(success).catch(fail);
}

export {
  saveTripDiary,
  readTripDiary,
  updateTripDiary,
  deleteTripDiary,
  setShareStatusTripDiary,
  checkEditAuthentication,
  getAllTripDiaries,
  getAccountTripDiary,
  likeTripDiaries,
  unlikeTripDiaries,
};
