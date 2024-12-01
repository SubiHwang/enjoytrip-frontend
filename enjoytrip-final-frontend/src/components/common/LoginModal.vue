<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authAxios } from "@/util/http-commons";
import { useUserStore } from "@/stores/user-store";

const api = authAxios();
const router = useRouter();
const isOpen = ref(false);
const userId = ref("");
const userPassword = ref("");
const isLoading = ref(false);
const userStore = useUserStore();

const openModal = () => {
  isOpen.value = true;
};

const closeModal = () => {
  userId.value = "";
  userPassword.value = "";
  isOpen.value = false;
};

// 로그인 토큰 요청
const loginToken = async (userId, userPassword) => {
  try {
    // Content-Type 헤더 추가
    const response = await api.post("/member/login", {
      userId: userId,
      userPassword: userPassword,
    });

    const accessToken = response.data["access-token"];
    const refreshToken = response.data["refresh-token"];

    // 토큰 저장
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // 이후 요청에 사용할 Authorization 헤더 설정
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    return response;
  } catch (error) {
    console.error("로그인 에러:", error);
    throw error;
  }
};

// 로그인 폼 제출 처리
const handleLogin = async () => {
  if (!userId.value || !userPassword.value) {
    alert("아이디와 비밀번호를 모두 입력해주세요.");
    return;
  }

  try {
    isLoading.value = true;
    const response = await loginToken(userId.value, userPassword.value);

    if (response.status === 200 || response.status === 201) {
      // Pinia 스토어에 로그인 정보 저장
      userStore.setLoginInfo({
        userInfo: response.data.userInfo, // 서버에서 보내준 사용자 정보
        accessToken: response.data["access-token"],
        refreshToken: response.data["refresh-token"],
      });

      alert("로그인이 완료되었습니다.");
      closeModal();
      router.push("/").then(() => {
        location.reload(); // 라우팅 완료 후 페이지 새로고침
      });
    }
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          alert("아이디 또는 비밀번호가 올바르지 않습니다.");
          break;
        case 404:
          alert("존재하지 않는 사용자입니다.");
          break;
        default:
          alert("로그인 중 오류가 발생했습니다.");
      }
    } else {
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  } finally {
    isLoading.value = false;
  }
};

defineExpose({
  openModal,
  closeModal,
});
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal-container">
        <!-- 닫기 버튼 -->
        <button @click="closeModal" class="close-button">×</button>

        <!-- 로고 -->
        <div class="logo-container">
          <img src="@/assets/enjoylogo.png" alt="Enjoy Trip" class="logo" />
        </div>

        <!-- 제목 -->
        <!-- <h2 class="modal-title">나의 여행기록 서비스</h2> -->
        <div class="logo-container mb-4">
          <img src="@/assets/enjoylogoname.png" alt="Enjoy Trip" class="logo" />
        </div>

        <!-- 로그인 폼 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <input
            type="text"
            v-model="userId"
            placeholder="아이디"
            class="input-field"
          />
          <input
            type="password"
            v-model="userPassword"
            placeholder="비밀번호"
            class="input-field"
          />
          <button type="submit" class="login-button">로그인</button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  position: relative;
  width: 400px;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
}

.close-button:hover {
  color: #333;
}

.logo-container {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  height: 32px;
}

.modal-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #333;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.input-field:focus {
  outline: none;
  border-color: #f8d33e;
}

.login-button {
  width: 100%;
  padding: 12px;
  background-color: #f8d33e;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover {
  background-color: #f8d33e;
}

/* 반응형 스타일 */
@media (max-width: 480px) {
  .modal-container {
    width: 90%;
    margin: 0 20px;
  }
}
</style>
