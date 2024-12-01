<script setup>
import defaultProfile from "@/assets/default-profile.png";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user-store";
import router from "@/router";

const emit = defineEmits(["show-login-modal", "show-message-modal"]);
const userStore = useUserStore();
const { isLoggedIn, userInfo } = storeToRefs(userStore);

const handleLoginClick = () => {
  emit("show-login-modal");
};

const handleMessageClick = () => {
  emit("show-message-modal");
};

const handleLogout = () => {
  userStore.logout();
  isLoggedIn.value = false;
  router.push("/").then(() => {
    location.reload(); // 라우팅 완료 후 페이지 새로고침
  });
};
</script>

<template>
  <header class="header">
    <nav class="navbar navbar-expand-lg">
      <div class="container-fluid">
        <div class="d-flex align-items-center">
          <!-- 로고 -->
          <router-link to="/" class="navbar-brand d-flex align-items-center">
            <img
              src="@/assets/enjoylogo.png"
              alt="로고"
              class="me-2"
              height="50"
            />
            <img
              src="@/assets/enjoylogoname.png"
              alt="로고이름"
              class="me-5"
              height="28"
            />
          </router-link>

          <!-- 메인 네비게이션 -->
          <ul class="navbar-nav flex-row main-nav space-x-4 text-lg font-bold">
            <li class="nav-item">
              <router-link to="/" class="nav-link fs-4 me-4 fw-bold"
                >여행일기</router-link
              >
            </li>
            <li class="nav-item">
              <router-link to="/attractions" class="nav-link fs-4 me-4 fw-bold"
                >관광지 조회</router-link
              >
            </li>
            <li class="nav-item">
              <router-link to="/graph" class="nav-link fs-4 fw-bold"
                >여행지 추천</router-link
              >
            </li>
          </ul>
        </div>

        <!-- 사용자 메뉴 -->
        <div v-if="!isLoggedIn" class="navbar-nav user-nav">
          <a class="nav-link" href="#" @click.prevent="handleLoginClick"
            >로그인</a
          >
          <router-link class="nav-link" to="/signup">회원가입</router-link>
        </div>

        <div v-else class="navbar-nav align-items-center">
          <div class="dropdown">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center profile-dropdown"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
            >
              <img
                :src="userInfo?.profileUrl || defaultProfile"
                altg="프로필"
                class="rounded-circle me-2"
                width="50"
                height="50"
              />
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <router-link class="dropdown-item" to="/my-diary">
                  나의 여행일기
                </router-link>
              </li>
              <li>
                <a
                  class="dropdown-item"
                  href="#"
                  @click.prevent="handleMessageClick"
                >
                  쪽지보기
                </a>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a class="dropdown-item" href="#" @click.prevent="handleLogout">
                  로그아웃
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.header {
  border-bottom: 1px solid #e5e5e5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}
.rounded-circle {
  object-fit: cover;
  border: 2px solid #ffe57f; /* 노란색 테두리 */
  /* padding: 2px; 선택적: 이미지와 테두리 사이 여백 */
}
.navbar {
  min-height: 100px;
  background-color: white;
  padding: 0.5rem 1rem;
}

.navbar-brand {
  padding: 0;
  margin-right: 3rem;
}

/* 메인 네비게이션 스타일 */
.main-nav {
  gap: 1.5rem;
}

/* nav-link 기본 스타일 */
.main-nav .nav-link {
  position: relative;
  padding: 0.75rem 1.2rem;
  color: #1f2937;
  font-weight: 500;
  transition: all 0.3s ease;
  letter-spacing: 0.1em;
}

/* hover 효과와 active 상태를 위한 가상 요소 */
.main-nav .nav-link::before {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #ffe57f;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.main-nav .nav-link:hover::before,
.main-nav .router-link-active::before {
  transform: scaleX(1);
}

/* 메인 네비게이션 스타일 */
.main-nav {
  gap: 1.5rem;
  position: relative; /* 추가 */
}

.main-nav .nav-item {
  position: relative;
}
/* 사용자 메뉴 스타일 */
.user-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 드롭다운 메뉴 스타일 */
.dropdown-menu {
  min-width: 250px;
  padding: 0.5rem 0;
  border: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 0.5rem;
}

.dropdown-item {
  padding: 0.8rem 1.2rem;
  color: #1f2937;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #fff9c4;
  color: #1f2937;
}

.dropdown-divider {
  margin: 0.5rem 0;
  border-color: #e5e5e5;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .navbar {
    min-height: 80px;
  }

  .main-nav {
    gap: 1rem;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }
}
</style>
