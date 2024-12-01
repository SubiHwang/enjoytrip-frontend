<script setup>
import baseImage from '@/assets/base-attraction-image.svg';

const prop = defineProps({
  attraction: {
    type: Object,
    required: true
  },
  readonly: {  // 모드 추가
    type: Boolean,
    default: true,
  },
  onSelect: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['addToTripRoute'])

const addToTripRoute = () => {
  prop.onSelect(prop.attraction);
};
</script>

<template>
    <div class="info-window">
      <div class="info-window-content">
        <div class="image-content">
          <img :src="attraction.image || baseImage" :alt="attraction.title">
        </div>
        <div class="text-content">
          <h3>{{ attraction.title }}</h3>
          <p>{{ attraction.addr }}</p>
        </div>
      </div>
      <div v-if="!readonly" class="action-content">
        <button @click="addToTripRoute">추가</button>
      </div>
    </div>
  </template>

<style scoped>
.info-window {
  padding: 15px;
  width: 300px;
  font-family: 'Arial', sans-serif;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  border-radius: 8px;
  background: white;
}

.info-window-content {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.image-content img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.text-content {
  flex: 1;
}

.text-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
}

.text-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* .action-content {
  padding-top: 10px;
  border-top: 1px solid #eee;
  text-align: right;
}

.action-content button {
  padding: 6px 12px;
  background: #4F46E5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-content button:hover {
  background: #4e46dc;
} */
</style>
