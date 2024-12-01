<script setup>
import TripDiaryMap from "@/components/tripdiary/TripDiaryMap.vue";
import {
  readTripDiary,
  checkEditAuthentication,
  deleteTripDiary,
  setShareStatusTripDiary,
  likeTripDiaries,
  unlikeTripDiaries,
} from "@/api/tripdiary";
import heart from "@/assets/heart.svg";
import heartfill from "@/assets/heart-fill.svg";
import { useRoute, useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import defaultProfile from "@/assets/default-profile.png";

const route = useRoute();
const router = useRouter();

const diaryId = route.params.diaryId;

const useMap = ref(true);
const isOwned = ref(false);
const isPublic = ref(false);
const isLike = ref(false);
const title = ref("");
const content = ref("");
const startDate = ref("");
const endDate = ref("");

const writerId = ref("");
const writerProfileUrl = ref("");

const selectedPlaces = ref([]);
const currentSelectedDay = ref(1);
const totalDays = ref([1]);

onMounted(() => {
  getTripDiary(diaryId);
});

const getTripDiary = async (diaryId) => {
  try {
    const { data } = await readTripDiary(diaryId);

    useMap.value = data.hasMap;
    isOwned.value = data.owned;
    isPublic.value = data.public;
    isLike.value = data.like;
    title.value = data.title;
    content.value = data.content;
    startDate.value = data.startDate;
    endDate.value = data.endDate;
    totalDays.value = Array.from({ length: data.totalDays }, (_, i) => i + 1);

    writerId.value = data.member.userId;
    writerProfileUrl.value = data.member.profileUrl;

    data.tripRoutes.forEach((tripRoute) => {
      const parseTime = (timeStr) => {
        if (!timeStr) return { hour: "", minute: "", period: "AM" };
        const [time, period] = timeStr.split(" ");
        const [hour, minute] = time.split(":");
        return { hour, minute, period };
      };

      const startTime = parseTime(tripRoute.detailStartTime);
      const endTime = parseTime(tripRoute.detailEndTime);

      selectedPlaces.value.push({
        startTime,
        endTime,
        day: tripRoute.day,
        visitOrder: tripRoute.visitOrder,
        isEditing: false,
        ...tripRoute.attraction,
      });
    });
  } catch (error) {
    console.error("Error loading diary:", error);
  }
};

const handleDaySelection = (day) => {
  currentSelectedDay.value = day;
};

const handleUpdate = async () => {
  const response = await checkEditAuthentication(diaryId);

  if (response.status === 200) {
    router.push(`/trip-diary/edit/${diaryId}`);
  } else {
    alert("편집 권한이 없습니다.");
  }
};

const handleDelete = async () => {
  const response = await deleteTripDiary(diaryId);

  if (response.status === 200) {
    if (confirm("정말 삭제하시겠습니까?")) {
      alert("삭제되었습니다.");
      router.back();
    }
  } else {
    alert("편집 권한이 없습니다.");
  }
};

const handleShareStatus = async () => {
  const response = await setShareStatusTripDiary(diaryId, {
    share: !isPublic.value,
  });

  if (response.status === 200) {
    alert(
      isPublic.value
        ? "해당 게시물이 비공개 처리되었습니다."
        : "해당 게시물이 외부에 공개되었습니다."
    );
    location.reload();
  } else {
    alert("공유 상태 변경에 실패했습니다.");
  }
};

const handleProfileClick = () => {
  router.push(`/my-diary/${writerId.value}`);
};

const handleLikeClick = async () => {
  try {
    if (isLike.value) {
      await unlikeTripDiaries(
        diaryId,
        (response) => {
          if (response.status === 200) {
            isLike.value = false;
          }
        },
        (error) => {
          console.error("Failed to unlike:", error);
        }
      );
    } else {
      await likeTripDiaries(
        diaryId,
        (response) => {
          if (response.status === 200) {
            isLike.value = true;
          }
        },
        (error) => {
          console.error("Failed to like:", error);
        }
      );
    }
  } catch (error) {
    console.error("Error handling like:", error);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}
</script>

<template>
  <div class="container mt-3">
    <!-- Title -->
    <div class="d-flex justify-content-between align-items-center">
      <div class="title-text title-font">{{ title }}</div>
      <img
        class="m-3"
        @click="handleLikeClick"
        :src="isLike ? heartfill : heart"
        :alt="isLike ? '좋아요 됨' : '좋아요'"
        style="width: 24px; height: 24px; cursor: pointer"
      />
    </div>

    <div class="container">
      <div class="d-flex justify-content-between align-items-center">
        <!-- Writer -->
        <div class="d-flex align-items-center gap-2" @click="handleProfileClick">
          <img
            :src="writerProfileUrl || defaultProfile"
            class="rounded-circle"
            style="width: 40px; height: 40px; object-fit: cover"
          />
          <span>{{ writerId }}</span>
        </div>

        <!-- Date Range -->
        <div class="date-range">
          <span class="date-display">{{ formatDate(startDate) }}</span>
          <span v-if="endDate" class="date-display">~ {{ formatDate(endDate) }}</span>
        </div>
      </div>
    </div>

    <hr />

    <div v-if="isOwned" class="d-flex justify-content-end gap-2">
      <button class="custom-btn edit-btn" @click="handleUpdate">수정</button>
      <button class="custom-btn delete-btn" @click="handleDelete">삭제</button>
      <button :class="['custom-btn', { 'sharing-btn': isPublic }, { 'share-btn': !isPublic }]" @click="handleShareStatus">
        {{ isPublic ? "공유중" : "공유" }}
      </button>
    </div>

    <!-- Map -->
    <div v-if="useMap" class="map-container">
      <img src="@/assets/map-pin.png" class="pin-image" alt="pin" />
      <TripDiaryMap
        :selectedPlaces="selectedPlaces"
        :currentSelectedDay="currentSelectedDay"
        :totalDays="totalDays"
        :readonly="true"
        @day-selected="handleDaySelection"
      />
    </div>

    <!-- Content -->
    <div class="content mt-5 text-center"> <!-- text-center 추가 -->
      <div class="content-text" v-html="content"></div>
    </div>
  </div>
</template>

<style scoped>
.title-text {
  font-size: 35px;
  padding: 8px;
}

.date-display {
  padding: 4px 8px;
  color: #666;
}

.content-text {
  min-height: 300px;
  padding: 12px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.title-font {
  font-weight: 500;
}

.map-container {
  background-color: white;
  border-radius: 2px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  background-image: linear-gradient(#f1f1f1 1px, transparent 1px),
                    linear-gradient(90deg, #f1f1f1 1px, transparent 1px);
  background-size: 20px 20px;
}

.pin-image {
  position: absolute;
  top: -30px;  /* -15px에서 -10px로 아래로 이동 */
  left: -10px;  /* 20px에서 15px로 왼쪽으로 이동 */
  width: 70px;  /* 30px에서 40px로 크기 증가 */
  height: 70px; /* 30px에서 40px로 크기 증가 */
  transform: rotate(-20deg);
  filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.2));
  z-index: 5;
}

.custom-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.edit-btn {
  background-color: #4e46dc;
  color: white;
}

.edit-btn:hover {
  background-color: #373013;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(67, 56, 202, 0.3);
}

.delete-btn {
  background-color: #4e46dc;
  color: white;
}

.delete-btn:hover {
  background-color: #3730a3;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.share-btn {
  background-color: #4e46dc;
  color: white;
}

.share-btn:hover {
  background-color: #3730a3;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(248, 211, 62, 0.3);
}

.sharing-btn {
  background-color: #ffffff;
  border: 2px solid #4e46dc;
  color: #1f2937;
}

.sharing-btn:hover {
  background-color: #3730a3;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(248, 211, 62, 0.3);
}

.gap-2 {
  gap: 0.5rem;
}
</style>
