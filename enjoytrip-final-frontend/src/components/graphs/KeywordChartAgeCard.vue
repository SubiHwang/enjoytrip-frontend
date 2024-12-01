<script>
export default {
  name: 'TouristSpotList',
  props: {
    age: {
      type: Number,
      required: true,
      validator: (value) => {
        return value >= 0 && value <= 100
      }
    },
    keywords: {
      type: Array,
      required: true,
      validator: (value) => {
        return value.every(item =>
          'keyword' in item &&
          'searchCount' in item
        )
      }
    }
  }
}
</script>

<template>
  <div class="card">
    <div class="card-content">
      <h2 class="title">{{ age }}대 인기 키워드</h2>
      <div class="keywords-container">
        <div
          v-for="(item, index) in keywords"
          :key="item.keyword"
          class="keyword-item"
        >
          <div class="keyword-info">
            <div class="left-content">
              <div
                class="rank-circle"
                :class="{
                  'gold-rank': index === 0,
                  'silver-rank': index === 1,
                  'bronze-rank': index === 2
                }"
              >
                {{ index + 1 }}
              </div>
              <h3 class="keyword-name">{{ item.keyword }}</h3>
            </div>
            <div class="right-content">
              <p class="search-count">{{ item.searchCount }}명</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: 1.5rem;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.keywords-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.keyword-item {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.keyword-item:hover {
  transform: translateX(4px);
}

.keyword-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.left-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.right-content {
  margin-left: auto;
}

.rank-circle {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #9ca3af;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.gold-rank {
  background-color: #fbbf24;
}

.silver-rank {
  background-color: #94a3b8;
}

.bronze-rank {
  background-color: #cd7f32;
}

.keyword-name {
  font-weight: 600;
  font-size: 1.125rem;
}

.search-count {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>