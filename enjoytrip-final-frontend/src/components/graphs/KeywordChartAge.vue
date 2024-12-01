<script setup>
import KeywordChartAgeCard from './KeywordChartAgeCard.vue'
import { ref, onMounted } from 'vue';
import { getKeywordRankByAge } from '@/api/graph'

onMounted(() => {
  fetchKeywordRankByAge();
})

const fetchKeywordRankByAge = async () => {
  const response = await getKeywordRankByAge();

  if(response.status === 200) {
    response.data.forEach(item => {
      ranks.value.push({
        age: item.age,
        keywords: item.keywords
      })
    });
  } else {
    alert('서버가 응답하지 않습니다.');
  }
}

const ranks = ref([]);
</script>

<template>
  <div class="keyword-ranks">
    <div v-for="rank in ranks"
         :key="rank.age"
         class="rank-item">
      <KeywordChartAgeCard
        :age="rank.age"
        :keywords="rank.keywords"
      />
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1250px;
  margin: 0 auto;
  padding: 0 16px; /* 패딩 값을 24px에서 16px로 줄임 */
}

/* KeywordChartAge 컴포넌트의 스타일 */
.keyword-ranks {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem; /* 1.5rem에서 1rem으로 간격 줄임 */
  padding: 0.5rem; /* 패딩도 1rem에서 0.5rem으로 줄임 */
  max-width: 1200px; /* 최대 너비 설정 */
  margin: 0 auto;
}

.rank-item {
  width: 100%;
}

@media (max-width: 768px) {
  .keyword-ranks {
    grid-template-columns: 1fr;
    gap: 0.75rem; /* 모바일에서는 더 작은 간격 사용 */
  }
}
</style>
