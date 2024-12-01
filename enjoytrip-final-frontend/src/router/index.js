import { createRouter, createWebHistory } from "vue-router";
import { readTripDiary } from "@/api/tripdiary";
import HomeView from "../views/HomeView.vue";
import SignupView from "@/views/SignupView.vue";
import MyDiary from "@/views/MyDiary.vue";
import AttractionView from "@/views/AttractionView.vue";
import ProfileSettingView from "@/views/ProfileSettingView.vue";
import { useUserStore } from "@/stores/user-store";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/signup",
    name: "Signup",
    component: SignupView,
  },
  {
    path: "/attractions",
    name: "attractions",
    component: AttractionView,
  },
  {
    path: "/login",
    name: "Login",
    beforeEnter: (to, from, next) => {
      const modalComponent =
        document.querySelector("#app")?.__vueParentComponent?.ctx?.$refs
          ?.loginModal;
      if (modalComponent) {
        modalComponent.openModal();
      }
      next(false);
    },
  },
  {
    path: "/my-diary/", // userId 없는 기본 경로
    name: "MyDiaryDefault",
    component: MyDiary,
    beforeEnter: async (to, from, next) => {
      // userId가 존재하지 않는 사용자일 경우 처리
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      next(`/my-diary/${userInfo.userId}`);
    },
  },
  // URL의 userId와 로그인한 사용자의 ID가 다르면 그대로 진행 (다른 사용자의 프로필)
  // userId가 없는 경우는 위의 라우트에서 처리됨
  {
    path: "/my-diary/:userId", // userId가 있는 경로
    name: "MyDiary",
    component: MyDiary,
  },
  {
    path: "/trip-diary/edit/:diaryId",
    name: "trip-diary-edit",
    component: () => import("@/views/TripDiaryEditView.vue"),
    beforeEnter: (to, from, next) => {
      if (from.path === "/trip-diary/" + to.params.diaryId) {
        // 조회페이지에서만 편집페이지로 이동 가능
        next();
      } else {
        alert("잘못된 접근입니다.");
        next(false);
      }
    },
  },
  {
    path: "/trip-diary/edit",
    name: "ttrip-diary-edit-new",
    component: () => import("@/views/TripDiaryEditView.vue"),
  },
  {
    path: "/trip-diary/:diaryId",
    name: "trip-diary-read",
    component: () => import("@/views/TripDiaryReadView.vue"),
    beforeEnter: async (to, from, next) => {
      try {
        const response = await readTripDiary(to.params.diaryId);
        next();
      } catch (error) {
        if (error.response?.status === 404) {
          next("/404");
        } else {
          alert("접근할 수 없는 게시물입니다.");
          next("/trip-diary");
        }
      }
    },
  },
  {
    path: "/settings",
    name: "Settings",
    component: ProfileSettingView,
  },
  {
    path: "/file",
    name: "file",
    component: () => import("@/components/tripdiary/TripDiaryContent.vue"),
  },
  {
    path: "/graph",
    name: "graph",
    component: () => import("@/views/GraphView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 로그인 필요한 페이지 인증 가드
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("accessToken");
  const authRequired = ["/my-diary/", "/trip-diary/edit/", "/trip-diary/", "/graph"];

  if (authRequired.some((path) => to.path.startsWith(path)) && !token) {
    alert("로그인이 필요한 기능입니다.");
    next("/login");
  } else {
    next();
  }
});

export default router;
