<template>
  <div class="chart-wrapper">
    <div class="chart-title">
      전체 <span>Top5 키워드</span>
    </div>
    <div class="chart-container">
      <KeywordChartAll />
    </div>
  </div>

  <div class="chart-title2">
      사용자 연령대 별 <span>Top3 키워드</span>
    </div>
  <KeywordChartAge />
</template>

<script>
import KeywordChartAll from '@/components/graphs/KeywordChartAll.vue'
import KeywordChartAge from '@/components/graphs/KeywordChartAge.vue';

export default {
  name: 'KeywordChartWrapper',
  components: {
    KeywordChartAll,
    KeywordChartAge
  }
}
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1250px; /* 최대 너비 설정 */
  margin: 0 auto; /* 중앙 정렬 */
  padding: 0 24px; /* 좌우 여백 */
}

.chart-title {
  font-weight: 700;
  font-size: 30px;
  text-align: center;
}

.chart-title2 {
  font-weight: 700;
  font-size: 30px;
  text-align: center;
  margin-top: 80px;
  margin-bottom: 30px;
}

.chart-title span {
  color: #221F5F;
}

.chart-container {
  margin-top: 20px;
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .chart-title {
    font-size: 24px;
  }

  .chart-container {
    height: 250px;
  }
}
</style>
