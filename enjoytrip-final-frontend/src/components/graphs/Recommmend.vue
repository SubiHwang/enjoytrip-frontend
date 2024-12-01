<script setup>
import { ref, onMounted } from "vue";
import { authAxios } from "@/util/http-commons";
import { storeToRefs } from "pinia";
import { useUserStore } from "@/stores/user-store";

const api = authAxios();

const recommendations = ref([]);
const isLoading = ref(false);
const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
// API 호출 함수
const fetchRecommendations = async () => {
  try {
    isLoading.value = true;

    // 1. 연령대별 인기 검색어 데이터 가져오기
    const response = await api.get("http://localhost/ai/chat", {
      params: {
        age: userInfo.value?.age || 20,
      },
    });

    // 2. 받아온 데이터 가공
    const keywordData = response.data;

    console.log("keyword: " + keywordData);

    // 각 추천지를 배열로 분리
    const recommendationsList = response.data
      .split(/\d+\.\s+/) // 숫자. 으로 시작하는 부분을 기준으로 분리
      .filter((item) => item.trim()) // 빈 문자열 제거
      .map((text, index) => {
        // 각 추천지의 정보를 줄 단위로 분리
        const lines = text.split("\n").filter((line) => line.trim());

        // 장소 이름 추출 (첫 번째 줄)
        const placeName = lines[0].replace(/[\[\]]/g, "").trim();

        // 나머지 정보 추출
        const details = {
          location: "",
          features: "",
          recommendationPoint: "",
          tip: "",
        };

        lines.forEach((line) => {
          if (line.includes("관광지 위치:")) {
            details.location = line.split("관광지 위치:")[1].trim();
          } else if (line.includes("특징:")) {
            details.features = line.split("특징:")[1].trim();
          } else if (line.includes("추천 포인트:")) {
            details.recommendationPoint = line.split("추천 포인트:")[1].trim();
          } else if (line.includes("꿀팁:")) {
            details.tip = line.split("꿀팁:")[1].trim();
          }
        });

        return {
          id: index + 1,
          place: placeName,
          ...details,
        };
      });

    console.log("Parsed Recommendations:", recommendationsList);
    recommendations.value = recommendationsList;
  } catch (err) {
    console.error("Failed to fetch recommendations:", err);
  } finally {
    isLoading.value = false;
  }
};

// 로컬스토리지에서 사용자 정보 가져오기
const userId = ref("");
onMounted(async () => {
  // 추천 데이터 가져오기
  await fetchRecommendations();
});
</script>

<template>
  <div class="page-wrapper">
    <div class="recommendation-container">
      <div class="header-section">
        <h1 class="title">{{ userInfo.userId }}님을 위한 맞춤 추천</h1>
        <p class="subtitle">
          {{ userInfo.userId }}님의 연령대에 맞는 추천 관광지입니다.
        </p>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        데이터를 불러오는 중...
      </div>

      <!-- 카드 그리드 -->
      <div v-else class="card-grid">
        <div
          v-for="rec in recommendations"
          :key="rec.id"
          class="recommendation-card"
        >
          <div class="card-header">
            <div class="rank-badge">#{{ rec.id }}</div>
            <div class="trophy-icon">🏆</div>
          </div>

          <h2 class="place-name">{{ rec.place }}</h2>

          <div class="info-section">
            <div class="info-item location">
              <span class="icon">📍</span>
              <!-- <span class="label">위치:</span> -->
              <span class="content">{{ rec.location }}</span>
            </div>

            <div class="info-item features">
              <!-- <span class="icon">✨</span> -->
              <!-- <span class="label">특징:</span> -->
              <span class="content">{{ rec.features }}</span>
            </div>

            <div class="info-item recommendation">
              <span class="icon">💡</span>
              <span class="label">추천 포인트</span>
              <span class="content">{{ rec.recommendationPoint }}</span>
            </div>

            <div class="tip-section">
              <span class="icon">💎</span>
              <span class="label">꿀팁</span>
              <span class="content">{{ rec.tip }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  border-radius: 30px; /* 더 둥근 모서리로 변경 */
  padding: 2rem;
  min-height: 1000px;
  margin: 0 auto;
  max-width: 1250px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  padding: 10px;
  padding-top: 30px;
  margin-bottom: 100px;
  margin-top: 100px;
}

.recommendation-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

.recommendation-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.recommendation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.rank-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
}

.trophy-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.place-name {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-item,
.tip-section {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex-direction: column; /* flex 방향을 세로로 변경 */
  align-items: flex-start;
  transition: all 0.2s ease;
}

.info-item:hover,
.tip-section:hover {
  background: rgba(255, 255, 255, 0.15);
}

.icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.label {
  font-weight: 600;
  margin-right: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.content {
  flex: 1;
  line-height: 1.6;
}

.tip-section {
  background: rgba(255, 255, 255, 0.15);
  margin-top: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.loading {
  text-align: center;
  padding: 3rem;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .recommendation-card {
    padding: 1.5rem;
  }
}

/* 애니메이션 효과 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recommendation-card {
  animation: fadeInUp 0.5s ease-out forwards;
}

.recommendation-card:nth-child(2) {
  animation-delay: 0.2s;
}

.recommendation-card:nth-child(3) {
  animation-delay: 0.4s;
}
</style>
