<script setup>
import { RouterLink, RouterView } from "vue-router";
import { ref, onMounted } from "vue";
import TheHeader from "@/components/common/TheHeader.vue";
import LoginModal from "@/components/common/LoginModal.vue";
import { useUserStore } from "./stores/user-store";
import MessageModal from "./components/common/MessageModal.vue";

const loginModalRef = ref(null);
const MessageModalRef = ref(null);
const userStore = useUserStore();

// 헤더에서 발생한 이벤트를 처리
const handleShowLoginModal = () => {
  loginModalRef.value?.openModal();
};

const handleShowMessageModal = () => {
  MessageModalRef.value?.openModal();
};

// 앱이 마운트된 후에 initializeUserInfo 액션 호출
onMounted(async () => {
  await userStore.initializeAuth();
});
</script>

<template>
  <TheHeader
    @show-login-modal="handleShowLoginModal"
    @show-message-modal="handleShowMessageModal"
  />
  <RouterView />
  <LoginModal ref="loginModalRef" />
  <MessageModal ref="MessageModalRef" />
</template>

<style>
.title-font {
  font-family: "custom-title-font", sans-serif;
}
</style>
