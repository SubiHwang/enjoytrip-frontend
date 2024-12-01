<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import TripDiaryCard from "@/components/tripdiary/TripDiaryCard.vue";
import { readTripDiary, likeTripDiaries, unlikeTripDiaries } from "@/api/tripdiary";

const router = useRouter();
const isLoading = ref(true);
const diaries = ref([]);
const viewType = ref("all");

const handleLike = async (diaryId) => {
  try {
    await likeTripDiaries(
      diaryId,
      (response) => {
        if (response.status === 200) {
          // 좋아요 상태 업데이트
          const diary = diaries.value.find(d => d.diaryId === diaryId);
          if (diary) {
            diary.like = true;
            diary.likeCount += 1;
          }
        }
      },
      (error) => {
        console.error("Failed to like:", error);
        alert('좋아요에 실패했습니다.');
      }
    );
  } catch (error) {
    console.error("Error liking diary:", error);
    alert('요청 처리 중 오류가 발생했습니다.');
  }
};

const handleUnlike = async (diaryId) => {
  try {
    await unlikeTripDiaries(
      diaryId,
      (response) => {
        if (response.status === 200) {
          // 좋아요 취소 상태 업데이트
          const diary = diaries.value.find(d => d.diaryId === diaryId);
          if (diary) {
            diary.like = false;
            diary.likeCount -= 1;
          }
        }
      },
      (error) => {
        console.error("Failed to unlike:", error);
        alert('좋아요 취소에 실패했습니다.');
      }
    );
  } catch (error) {
    console.error("Error unliking diary:", error);
    alert('요청 처리 중 오류가 발생했습니다.');
  }
};

const fetchDiaries = async () => {
  try {
    isLoading.value = true;
    const response = await readTripDiary(
      viewType.value === "all" ? "/all" : "/following"
    );

    if(response.status === 200) {
      diaries.value = response.data;
    }
  } catch (error) {
    console.error("여행 기록 조회 실패:", error);
    alert('로그인이 필요한 기능입니다.')
    diaries.value = [];
  } finally {
    isLoading.value = false;
  }
};

const changeViewType = async (type) => {
  viewType.value = type;
  await fetchDiaries();
};

onMounted(fetchDiaries);
</script>

<template>
  <header class="header-section">
    <div class="home-container">
      <h1 class="main-title">
        <span>당신의 특별한 여행,</span>
        <br />
        <span class="highlight">기록</span>하고
        <span class="highlight">공유</span>하세요
      </h1>
      <p class="subtitle">
        전국의 아름다운 장소들을 발견하고, 당신만의 특별한 여행 이야기를
        남겨보세요
      </p>
    </div>
  </header>

  <div class="home-container">
    <div class="filter-section">
      <div class="view-toggle">
        <button
          :class="['toggle-btn', { active: viewType === 'all' }]"
          @click="changeViewType('all')"
        >
          전체 여행기록
        </button>
        <button
          :class="['toggle-btn', { active: viewType === 'following' }]"
          @click="changeViewType('following')"
        >
          팔로잉 여행기록
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
    </div>
    <div v-else-if="diaries.length === 0" class="empty-state">
      <p>아직 등록된 여행 기록이 없어요 ✈️</p>
    </div>
    <div class="diary-grid">
      <TripDiaryCard
        v-for="diary in diaries"
        :key="diary.diaryId"
        :diary="{
          id: diary.diaryId,
          thumbnailUrl: diary.thumbnailUrl,
          title: diary.title,
          startDate: diary.startDate,
          endDate: diary.endDate,
          writer: {
            id: diary.userId,
            profileUrl: diary.profileUrl,
          },
          like: {
            isLike: diary.like,
            count: diary.likeCount,
          },
        }"
        @like="handleLike"
        @unlike="handleUnlike"
        @click="router.push(`/trip-diary/${diary.diaryId}`)"
      />
    </div>
  </div>
</template>

<style scoped>
/* 헤더 섹션 */
.header-section {
  width: 100%;
  /* background: #fff9c4; */
  padding: 6rem 1rem 8rem;
  position: relative;
  overflow: visible;
  text-align: left;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url("@/assets/background5.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 메인 타이틀 */
.main-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 2rem;
  line-height: 1.2;
  color: white;
  max-width: 800px;
}

.main-title span {
  display: inline-block;
}

.main-title br {
  margin: 2rem 0;
}

.highlight {
  color: #f8d33e;
  font-weight: 800;
  margin-right: 0.2em;
}

.subtitle {
  font-size: 1.2rem;
  color: white;
  max-width: 600px;
  margin: 0;
  font-weight: 500;
}

/* 네비게이션 링크 */
.nav-link {
  position: relative;
  padding: 0.5rem 1rem;
  color: #1f2937;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-link:hover::before,
.router-link-active::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% + 20px);
  height: calc(100% + 20px);
  background-color: #fff9c4;
  border-radius: 999px;
  z-index: -1;
  opacity: 0.7;
}

/* 필터 섹션 */
.filter-section {
  margin-top: -2rem;
  position: relative;
  z-index: 2;
}

.view-toggle {
  display: flex;
  justify-content: center;
  gap: 0;
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 9999px;
  width: fit-content;
  margin: 0 auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.toggle-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  color: #6b7280;
}

.toggle-btn.active {
  background: white;
  color: #4e46dc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 그리드 레이아웃 */
.diary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
}

/* 로딩 상태 */
.loading {
  text-align: center;
  padding: 3rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top-color: #4e46dc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: #6b7280;
  font-size: 1.1rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .header-section {
    padding: 4rem 1rem 6rem;
  }

  .main-title {
    font-size: 2.5rem;
  }

  .main-title br {
    margin: 1.5rem 0;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .toggle-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }

  .diary-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
}
</style>
