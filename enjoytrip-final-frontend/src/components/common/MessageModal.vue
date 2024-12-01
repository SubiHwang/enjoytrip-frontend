<script setup>
import { onMounted, ref, watch } from "vue";
import { format, parseISO } from "date-fns";
import { authAxios } from "@/util/http-commons";

const api = authAxios();
const isOpen = ref(false);
const selectedMessage = ref(null);
const messageList = ref([]);

const fetchMessages = async () => {
  try {
    const { data } = await api.get("/messages/all");
    messageList.value = data;
  } catch (error) {
    console.error("메시지 조회 실패:", error);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return ""; // dateString이 없을 때 처리
  try {
    return format(parseISO(dateString), "yyyy.MM.dd HH:mm");
  } catch (error) {
    console.error("날짜 포맷 에러:", error);
    return dateString; // 변환 실패시 원본 반환
  }
};

onMounted(() => {
  fetchMessages();
});

watch(
  messageList,
  (newList) => {
    if (newList.length === 0) {
      closeModal();
    }
  },
  { deep: true }
);

const openModal = async () => {
  isOpen.value = true;
  await fetchMessages();
};

const closeModal = () => {
  isOpen.value = false;
  selectedMessage.value = null;
};

const deleteMessage = async (message) => {
  try {
    await api.delete(`/messages/${message.messageId}`, {
      params: {
        senderId: message.senderId,
      },
    });
    // 목록에서 제거
    messageList.value = messageList.value.filter(
      (msg) => msg.messageId !== message.messageId
    );
    closeModal();

    alert("메시지 삭제 완료!");
  } catch (error) {
    console.error("삭제 실패ㅠㅠ:", error);
    alert("메시지 삭제 실패했어요!");
  }
};

const viewMessage = (message) => {
  selectedMessage.value = message;
};

defineExpose({ openModal });
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h2>쪽지</h2>
          <button @click="closeModal" class="close-button">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <div class="message-list">
          <div
            v-for="message in messageList"
            :key="message.messageId"
            class="message-item"
          >
            <div class="user-info">
              <img
                src="@/assets/default-profile.png"
                :alt="message.senderId"
                class="user-avatar"
              />
              <div class="user-details">
                <span class="user-id">{{ message.senderId }}</span>
                <span class="created-time">{{
                  formatDate(message.createdAt)
                }}</span>
              </div>
            </div>
            <div class="action-buttons">
              <button
                class="action-btn delete-btn"
                @click="deleteMessage(message)"
              >
                삭제
              </button>
              <button class="action-btn view-btn" @click="viewMessage(message)">
                보기
              </button>
            </div>
          </div>
        </div>

        <div class="message-content-section" v-if="selectedMessage">
          <h3>메시지 내용</h3>
          <span class="created-time">{{
            formatDate(selectedMessage.createdAt)
          }}</span>
          <div class="message-content">
            <p>{{ selectedMessage.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
}

.modal-container {
  background: white;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  border-radius: 15px;
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.message-list {
  padding: 15px;
  overflow-y: auto;
  max-height: calc(40vh - 70px);
}

.message-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
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
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn {
  background-color: #ff4757;
  color: white;
}

.view-btn {
  background-color: #3498db;
  color: white;
}

.delete-btn:hover {
  background-color: #ff6b81;
}

.view-btn:hover {
  background-color: #2980b9;
}

.message-content-section {
  padding: 20px;
  border-top: 1px solid #eee;
}

.message-content-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.message-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.close-button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
  color: #333;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.created-time {
  font-size: 12px;
  color: #666;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
</style>
