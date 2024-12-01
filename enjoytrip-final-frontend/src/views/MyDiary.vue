<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user-store";
import { useRoute, useRouter } from "vue-router";
import defaultProfile from "@/assets/default-profile.png";
import { authAxios } from "@/util/http-commons";
import { apiMessage } from "@/api/message";
import TripDiaryCard from "@/components/tripdiary/TripDiaryCard.vue";
import { getAccountTripDiary, likeTripDiaries, unlikeTripDiaries } from "@/api/tripdiary.js";

const api = authAxios();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
const myDiaries = ref([]);

// 상태 추가
const showFollowModal = ref(false);
const modalType = ref(""); // 'followers' 또는 'following'
const followList = ref([]);

// 상태 관리
const profileData = ref({
  userId: "",
  profileUrl: "",
  followingCnt: 0,
  followerCnt: 0,
  postCnt: 0,
  isFollowing: false,
});

const isLoading = ref(true);
const isSettingsOpen = ref(false);
const settingsButton = ref(null);

// 프로필 타입 계산
const profileType = computed(() => {
  if (!userInfo.value || !profileData.value) return null;
  return userInfo.value.userId === route.params.userId
    ? "own"
    : profileData.value.isFollowing
    ? "following"
    : "notFollowing";
});

// 프로필 데이터 조회
const fetchProfileData = async () => {
  try {
    isLoading.value = true;
    const response = await api.get(`/follows/${route.params.userId}/info`);
    if (response.data) {
      profileData.value = response.data;

      // userInfo와 현재 사용자의 ID가 같을 경우에만 userInfo 업데이트
      if (userInfo.value?.userId === route.params.userId) {
        // userStore의 userInfo 업데이트
        userStore.$patch({
          userInfo: {
            ...userInfo.value,
            profileUrl: response.data.profileUrl,
          },
        });

        // localStorage도 업데이트
        const storedUserInfo = JSON.parse(
          localStorage.getItem("userInfo") || "{}"
        );
        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            ...storedUserInfo,
            profileUrl: response.data.profileUrl,
          })
        );
      }
    }
  } catch (error) {
    console.error("프로필 데이터 로드 실패:", error?.response || error);
  } finally {
    isLoading.value = false;
  }
};

// 팔로워/팔로잉 목록 조회
const fetchFollowList = async (type) => {
  try {
    const response = await api.get(`/follows/${route.params.userId}/infoList`);
    if (response.data) {
      followList.value = response.data[type]; // followers 또는 following
    }
  } catch (error) {
    console.error(`${type} 목록 조회 실패:`, error);
  }
};

//나의 여행 기록 게시물 불러오기
const fetchMyDiaries = async () => {
  try {
    isLoading.value = true;
    const response = await getAccountTripDiary(route.params.userId);
    profileData.value.postCnt = response.data.filter((item) => item.owned === true || item.public === true).length;
    myDiaries.value = response.data;
  } catch (error) {
    console.error("여행 기록 불러오기 실패ㅠㅠ:", error);
  } finally {
    isLoading.value = false;
  }
};

// 외부 클릭 감지
const handleClickOutside = (event) => {
  if (
    isSettingsOpen.value &&
    settingsButton.value &&
    !settingsButton.value.contains(event.target)
  ) {
    isSettingsOpen.value = false;
  }
};

// 팔로우/언팔로우 처리
const handleFollow = async () => {
  try {
    if (profileData.value.isFollowing) {
      await api.delete(`/follows/${route.params.userId}`);
      alert("팔로우가 취소되었습니다");
    } else {
      await api.post("/follows", {
        followingId: route.params.userId,
      });
      alert("팔로우 되었습니다");
    }
    await fetchProfileData();
  } catch (error) {
    console.error("팔로우 상태 변경 실패:", error);
    alert("팔로우/언팔로우 처리 중 오류가 발생했습니다");
  }
};

// 메시지 모달 상태
const showMessageModal = ref(false);
const selectedUser = ref(null);
const messageContent = ref("");

// 모달 열기 함수
const openFollowModal = async (type) => {
  modalType.value = type;
  await fetchFollowList(type);
  showFollowModal.value = true;
};

// 프로필 수정
const handleEdit = () => {
  router.push("/settings");
  isSettingsOpen.value = false;
};

// 회원 탈퇴
const handleDeleteUser = async () => {
  if (!confirm("정말 탈퇴하시겠습니까?")) return;

  try {
    await api.delete("/member/");
    userStore.logout();
    router.push("/");
    alert("회원 탈퇴가 완료되었습니다");
  } catch (error) {
    console.error("회원 탈퇴 실패:", error);
    alert("회원 탈퇴 처리 중 오류가 발생했습니다");
  }
  isSettingsOpen.value = false;
};

// 새 게시물
const handleAddPost = () => {
  router.push("/trip-diary/edit");
};

// 메시지 보내기
const handleMessage = (user) => {
  if (!user || !user.userId) {
    console.error("유저 정보 없음ㅠㅠ");
    return;
  }
  selectedUser.value = user; // 전체 user 객체를 저장
  showMessageModal.value = true;
};

// 좋아요 함수
const handleLike = async (diaryId) => {
  try {
    const response = await likeTripDiaries(diaryId);
    if (response.status === 200) {
      // 현재 diary 찾기
      const diaryIndex = myDiaries.value.findIndex(
        (diary) => diary.diaryId === diaryId
      );

      if (diaryIndex !== -1) {
        // 배열의 반응성을 유지하면서 업데이트
        const updatedDiary = { ...myDiaries.value[diaryIndex] };
        updatedDiary.like = true;
        updatedDiary.likeCount = (updatedDiary.likeCount || 0) + 1;

        // splice를 사용하여 반응성 있게 업데이트
        myDiaries.value.splice(diaryIndex, 1, updatedDiary);
      }
    }
  } catch (error) {
    console.error("Error liking diary:", error);
    alert('좋아요 처리 중 오류가 발생했습니다.');
  }
};

// 좋아요 취소 함수
const handleUnlike = async (diaryId) => {
  try {
    const response = await unlikeTripDiaries(diaryId);
    if (response.status === 200) {
      // 현재 diary 찾기
      const diaryIndex = myDiaries.value.findIndex(
        (diary) => diary.diaryId === diaryId
      );

      if (diaryIndex !== -1) {
        // 배열의 반응성을 유지하면서 업데이트
        const updatedDiary = { ...myDiaries.value[diaryIndex] };
        updatedDiary.like = false;
        updatedDiary.likeCount = Math.max((updatedDiary.likeCount || 1) - 1, 0);

        // splice를 사용하여 반응성 있게 업데이트
        myDiaries.value.splice(diaryIndex, 1, updatedDiary);
      }
    }
  } catch (error) {
    console.error("Error unliking diary:", error);
    alert('좋아요 취소 중 오류가 발생했습니다.');
  }
};

// 메시지 보내기 함수
const sendMessage = async () => {
  try {
    // 먼저 데이터 체크
    if (!selectedUser.value?.userId) {
      alert("수신자 정보가 없네요!");
      return;
    }

    if (!messageContent.value.trim()) {
      alert("메시지 내용을 입력해주세요!");
      return;
    }

    await apiMessage({
      receiverId: selectedUser.value.userId,
      content: messageContent.value.trim(),
    });

    alert("메시지 전송 완료!");
    messageContent.value = "";
    showMessageModal.value = false;

    router.push(`/my-diary/${route.params.userId}`);
  } catch (error) {
    console.error("메시지 전송 실패ㅠㅠ:", error);
    alert("앗.. 메시지 전송 실패했어요 ㅠㅠ");
    router.push(`/my-diary/${route.params.userId}`);
  }
};


const handleCardClick = (diaryId) => {
  router.push(`/trip-diary/${diaryId}`);
};

// 라이프사이클 훅
onMounted(() => {
  fetchProfileData();
  fetchMyDiaries();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <!-- 로딩 스피너 -->
  <div v-if="isLoading" class="text-center py-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <!-- 메인 프로필 컨테이너 -->
  <div v-else-if="profileData" class="bg-white min-vh-100">
    <!-- 프로필 헤더 섹션 -->
    <div class="container-fluid border-bottom pb-4 bg-white">
      <div class="container py-4" style="max-width: 935px">
        <div class="d-flex flex-column flex-md-row align-items-center gap-4">
          <!-- 프로필 이미지 -->
          <div class="profile-image-container">
            <img
              :src="profileData.profileUrl || defaultProfile"
              @error="handleImageError"
              :alt="profileData.userId"
              class="rounded-circle profile-image"
              me-2
            />
            <!-- <img
              :src="profileData.profileUrl || defaultProfile"
              @error="(e) => console.error('Image load error:', e)"
              :alt="profileData.userId"
              class="rounded-circle profile-image"
            /> -->
          </div>

          <!-- 프로필 정보 -->
          <div class="flex-grow-1 mt-3">
            <!-- 유저네임과 버튼 영역 -->
            <div class="d-flex align-items-center gap-3 mb-4">
              <div class="userId-container">
                {{ profileData.userId }}
              </div>

              <div class="d-flex gap-2 align-items-center">
                <!-- 본인 프로필 -->
                <template v-if="profileType === 'own'">
                  <div class="d-flex gap-2 position-relative">
                    <button
                      class="btn btn-light rounded-circle p-2"
                      @click="isSettingsOpen = !isSettingsOpen"
                      ref="settingsButton"
                    >
                      <img src="@/assets/settings.png" width="20" height="20" />
                    </button>

                    <!-- 드롭다운 메뉴 -->
                    <div v-show="isSettingsOpen" class="settings-dropdown">
                      <ul class="list-unstyled m-0 p-0">
                        <li>
                          <button
                            class="dropdown-item py-2"
                            @click="handleEdit"
                          >
                            <span class="me-2">👤</span> 회원 정보 수정
                          </button>
                        </li>
                        <li>
                          <button
                            class="dropdown-item py-2 text-danger"
                            @click="handleDeleteUser"
                          >
                            <span class="me-2">⚠️</span> 회원 탈퇴
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </template>

                <!-- 다른 사람 프로필 -->
                <template v-else>
                  <button
                    class="follow-btn"
                    :class="profileData.isFollowing ? 'unfollow' : 'follow'"
                    @click="handleFollow"
                  >
                    {{ profileData.isFollowing ? "팔로우 취소" : "팔로우" }}
                  </button>
                </template>
              </div>
            </div>

            <!-- 통계 정보 -->
            <div class="d-flex gap-5 mb-4 justify-content-start">
              <div
                class="text-center"
                @click="openFollowModal('followers')"
                style="cursor: pointer"
              >
                <strong class="d-block">{{ profileData.followerCnt }}</strong>
                <span class="text-secondary">팔로워</span>
              </div>
              <div
                class="text-center"
                @click="openFollowModal('following')"
                style="cursor: pointer"
              >
                <strong class="d-block">{{ profileData.followingCnt }}</strong>
                <span class="text-secondary">팔로잉</span>
              </div>

              <!-- 팔로워/팔로잉 모달 -->
              <!-- 팔로워/팔로잉 모달 -->
              <div
                v-if="showFollowModal"
                class="modal-overlay"
                @click.self="showFollowModal = false"
              >
                <div class="modal-container">
                  <div class="modal-header">
                    <h5 class="modal-title">
                      {{ modalType === "followers" ? "팔로워" : "팔로잉" }}
                    </h5>
                    <button
                      class="close-button"
                      @click="showFollowModal = false"
                    >
                      &times;
                    </button>
                  </div>
                  <div class="modal-content">
                    <div
                      v-for="user in followList"
                      :key="user.userId"
                      class="user-item"
                    >
                      <div class="user-info">
                        <img
                          :src="user.profileUrl || defaultProfile"
                          :alt="user.userId"
                          class="user-avatar"
                        />
                        <span class="user-name">{{ user.userId }}</span>
                      </div>
                      <button
                        v-if="modalType === 'following'"
                        class="message-button"
                        @click="handleMessage(user)"
                      >
                        메시지
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 메시지 모달 -->
              <!-- 메시지 모달 -->
              <div
                v-if="showMessageModal"
                class="message-modal-overlay"
                @click.self="showMessageModal = false"
              >
                <div class="message-modal-container">
                  <div class="message-modal-header">
                    <div class="recipient-info">
                      <img
                        :src="selectedUser?.profileUrl || defaultProfile"
                        :alt="selectedUser?.userId"
                        class="recipient-avatar"
                      />
                      <span class="recipient-name">{{
                        selectedUser?.userId
                      }}</span>
                    </div>
                    <button
                      class="close-button"
                      @click="showMessageModal = false"
                    >
                      &times;
                    </button>
                  </div>
                  <div class="message-modal-body">
                    <textarea
                      v-model="messageContent"
                      class="message-input"
                      placeholder="메시지를 입력하세요..."
                      :maxlength="500"
                    ></textarea>
                    <div class="char-count">
                      {{ messageContent.length }}/500
                    </div>
                  </div>
                  <div class="message-modal-footer">
                    <button
                      class="cancel-button"
                      @click="showMessageModal = false"
                    >
                      취소
                    </button>
                    <button
                      class="send-button"
                      @click="sendMessage"
                      :disabled="!messageContent.trim()"
                    >
                      보내기
                    </button>
                  </div>
                </div>
              </div>

              <div class="text-center">
                <strong class="d-block">{{ profileData.postCnt || 0 }}</strong>
                <span class="text-secondary">게시물</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 여행 기록 섹션 -->
    <div class="container py-5">
      <!-- 여행 기록 그리드 -->
      <div v-if="myDiaries.length === 0" class="text-center py-5">
        <router-link to="/trip-diary/edit" class="btn btn-primary">
          첫 여행 기록 작성하기
        </router-link>
      </div>

      <div v-else class="diary-grid">
        <template v-for="diary in myDiaries" :key="diary.diaryId">
          <TripDiaryCard
            v-if="diary.owned === true || diary.public === true"
            :diary="{
              id: diary.diaryId,
              thumbnailUrl: diary.thumbnailUrl,
              title: diary.title,
              startDate: diary.startDate,
              endDate: diary.endDate,
              writer: { id: diary.userId, profileUrl: diary.profileUrl },
              like: { isLike: diary.like, count: diary.likeCount },
              isPublic: diary.isPublic,
            }"
            @like="handleLike(diary.diaryId)"
            @unlike="handleUnlike(diary.diaryId)"
            @click="handleCardClick(diary.diaryId)"
            class="cursor-pointer"
          />
        </template>
      </div>
    </div>

    <!-- 새 게시물 버튼 -->
    <button
      v-if="profileType === 'own'"
      @click="handleAddPost"
      class="btn btn-primary rounded-circle position-fixed bottom-0 end-0 m-4 p-3"
      style="z-index: 1000"
    >
      ✏️
    </button>
  </div>
</template>

<style scoped>
/* 프로필 이미지 */
.profile-image-container {
  width: 150px;
  height: 150px;
  flex-shrink: 0;
  margin-top: 1rem;
  margin-right: 3rem; /* 프로필 이미지 오른쪽 여백 추가 */
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid #dbdbdb;
}

/* 드롭다운 메뉴 */
.settings-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
  border: 1px solid #dbdbdb;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  transform: translateX(5px);
}

/* 게시물 그리드 */
.diary-entry {
  cursor: pointer;
  transition: all 0.3s ease;
}

.diary-entry:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.diary-thumbnail {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #dbdbdb;
}

/* 반응형 */
@media (max-width: 768px) {
  .profile-image-container {
    width: 100px;
    height: 100px;
  }
}

/* 애니메이션 */
.diary-entry {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 버튼 호버 효과 */
.btn:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

.settings-dropdown ul li:not(:last-child) {
  border-bottom: 1px solid #efefef;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.close-button:hover {
  color: #333;
}

.modal-content {
  padding: 12px;
  overflow-y: auto;
  max-height: calc(80vh - 60px);
}

.userId-container {
  font-weight: 700;
  font-size: 1.4rem;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: #f8f9fa;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #eee;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.follow-btn {
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.follow {
  background: #0095f6;
  color: white;
  border: none;
}

.follow:hover {
  background: #0081d6;
}

.unfollow {
  background: white;
  color: #262626;
  border: 1px solid #dbdbdb;
}

.unfollow:hover {
  background: #fafafa;
  border-color: #c7c7c7;
}

.message-btn {
  padding: 8px;
  border-radius: 50%;
  border: 1px solid #dbdbdb;
  background: white;
  color: #262626;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  transition: all 0.2s ease;
}

.message-btn:hover {
  background: #fafafa;
  border-color: #c7c7c7;
  transform: translateY(-2px);
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 스크롤바 스타일링 */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .modal-container {
    width: 95%;
    margin: 10px;
  }

  .user-avatar {
    width: 35px;
    height: 35px;
  }

  .user-name {
    font-size: 14px;
  }

  .message-button {
    padding: 4px 12px;
    font-size: 13px;
  }
}

/* 메시지 모달 스타일 */
.message-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.3s ease;
}

.message-modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 메시지 버튼 수정 */
.message-btn {
  padding: 0.75rem;
  border-radius: 9999px;
  border: 1px solid #e5e5e5;
  background: white;
  color: #1f2937;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.message-btn:hover {
  background-color: #fff9c4;
  transform: translateY(-2px);
}

/* 메시지 모달 버튼 수정 */
.message-button {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 1px solid #e5e5e5;
  background: white;
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.message-button:hover {
  background-color: #fff9c4;
  transform: translateY(-2px);
}

/* 새 게시물 버튼 수정 */
.btn-primary.rounded-circle {
  width: 3.5rem;
  height: 3.5rem;
  background-color: white;
  border: 1px solid #e5e5e5;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-primary.rounded-circle:hover {
  background-color: #fff9c4;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1);
}

.message-modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
}

.recipient-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recipient-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #eee;
}

.recipient-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.message-modal-body {
  padding: 20px;
  position: relative;
}

.message-input {
  width: 100%;
  min-height: 150px;
  padding: 15px;
  border: 1px solid #e1e1e1;
  border-radius: 12px;
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  transition: border-color 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #0095f6;
}

.char-count {
  position: absolute;
  bottom: 30px;
  right: 30px;
  font-size: 12px;
  color: #8e8e8e;
}

.message-modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #fff;
}

.cancel-button {
  padding: 8px 20px;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  background: white;
  color: #262626;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button:hover {
  background: #f8f9fa;
  border-color: #c7c7c7;
}

.send-button {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #0095f6;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover {
  background: #0081d6;
}

.send-button:disabled {
  background: #b2dffc;
  cursor: not-allowed;
}

.btn-light {
  width: 40px; /* 너비와 높이를 동일하게 설정 */
  height: 40px;
  background-color: white;
  border-radius: 50%; /* 완전한 원형을 위해 50% 사용 */
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.btn-light:hover {
  background-color: white;
  transform: none;
  box-shadow: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .message-modal-container {
    width: 95%;
    margin: 10px;
  }

  .message-input {
    min-height: 120px;
  }

  .message-modal-footer {
    padding: 12px 15px;
  }

  .send-button,
  .cancel-button {
    padding: 6px 15px;
    font-size: 14px;
  }
}

/* 팔로우/언팔로우 버튼 수정 */
.follow-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.follow {
  background-color: white;
  color: #1f2937;
  border: 1px solid #e5e5e5;
}

.follow:hover {
  background-color: #fff9c4;
  transform: translateY(-2px);
}

.unfollow {
  background-color: white;
  color: #1f2937;
  border: 1px solid #e5e5e5;
}

.unfollow:hover {
  background-color: #fff9c4;
  transform: translateY(-2px);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #4f46e5, #06b6d4);
  /* -webkit-background-clip: text; */
  -webkit-text-fill-color: transparent;
}

.filter-buttons {
  display: flex;
  gap: 10px;
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-btn.active {
  background: #4f46e5;
  color: white;
}

.filter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
}

.diary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 한 줄에 3개의 카드 */
  gap: 32px; /* 카드 사이 여백 */
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.diary-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.diary-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.diary-image {
  position: relative;
  padding-top: 75%;
  overflow: hidden;
}

.diary-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.diary-card:hover .diary-image img {
  transform: scale(1.1);
}

.diary-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 12px;
  border-radius: 12px;
}

.diary-date {
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
}

.like-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: white;
  border: none;
  border-radius: 12px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #ef4444;
  transition: all 0.3s ease;
}

.like-btn:hover {
  transform: scale(1.1);
}

.diary-content {
  padding: 20px;
}

.diary-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
}
/* 프로필 이미지 스타일 수정  */
.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 2px solid #ffe57f; /* 노란색 테두리 추가 */
  transition: all 0.3s ease;
}

/* 첫 여행 기록 작성하기 버튼 수정 */
.btn-primary {
  background-color: white;
  border: none;
  color: #1f2937;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background-color: #fff9c4;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.diary-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

/* 반응형 */
@media (max-width: 768px) {
  .diary-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }

  .filter-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.diary-card {
  animation: fadeIn 0.5s ease backwards;
}

.diary-card:nth-child(2) {
  animation-delay: 0.1s;
}

.diary-card:nth-child(3) {
  animation-delay: 0.2s;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  color: #1f2937;
}

.btn-primary:hover {
  background-color: #fff9c4;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: #1f2937; /* hover 시에도 글자색 유지 */
}
</style>
