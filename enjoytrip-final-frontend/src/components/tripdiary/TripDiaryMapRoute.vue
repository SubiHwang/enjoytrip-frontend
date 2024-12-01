<script setup>
defineProps({
  selectedPlaces: {
    type: Array,
    required: true,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: true
  },
  currentDay: Number
});

// 마커 색상 배열 정의 (지도 컴포넌트와 동일)
const markerColors = [
  '#1abc9c',  // 터키색
  '#9b59b6',  // 보라색
  '#e74c3c',  // 빨간색
  '#3498db',  // 파란색
  '#2ecc71',  // 초록색
  '#f1c40f'   // 노란색
];

const getMarkerColor = (index) => markerColors[index % markerColors.length];

const emit = defineEmits(['removedPlace', 'updateDay', 'updateTime']);

const handleTimeEdit = (placeNo) => {
  emit('updateTime', { placeNo, isEditing: true });
}

const handleTimeUpdate = (placeNo, place) => {
  emit('updateTime', {
    placeNo,
    isEditing: false,
    time: {
      startTime: {
        hour: place.startTime.hour,
        minute: place.startTime.minute,
        period: place.startTime.period
      },
      endTime: {
        hour: place.endTime.hour,
        minute: place.endTime.minute,
        period: place.endTime.period
      }
    }
  });
}

const handleResetTime = (placeNo) => {
  emit('updateTime', {
    placeNo,
    isEditing: true,
    time: {
      startTime: { hour: '', minute: '', period: 'AM' },
      endTime: { hour: '', minute: '', period: 'AM' }
    }
  });
}

const handlePlaceRemoval = (placeNo) => {
  emit('removedPlace', placeNo);
}
</script>

<template>
  <div class="places-container">
    <div v-for="(place, index) in selectedPlaces"
         :key="place.no"
         class="selected-place-item p-3 mb-2 bg-white rounded">
         <div class="d-flex align-items-start w-100">
          <span class="visit-order badge me-2" :style="{ backgroundColor: getMarkerColor(index) }">
            {{ place.visitOrder }}
          </span>
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between">
              <h5 class="mb-0 me-3 fw-bold" style="word-break: break-all; max-width: 70%;">{{ place.title }}</h5>
              <div class="d-flex gap-2 flex-shrink-0 align-items-center">
                <div v-if="!readonly">
                  <button class="custom-btn btn btn-sm p-1 px-2"
                        v-if="!place.isEditing"
                        @click="handleTimeEdit(place.no)">
                    시간
                  </button>
                  <button class="delete-btn btn btn-sm p-1 px-2 ms-1"
                          @click="handlePlaceRemoval(place.no)">
                    삭제
                  </button>
                </div>
              </div>
            </div>

            <!-- 수정 모드 -->
            <div v-if="place.isEditing && !readonly" class="time-inputs mt-2">
              <div class="time-input-container">
                <!-- 시작 시간 -->
                <div class="input-group">
                  <input type="number" v-model="place.startTime.hour"
                        class="form-control form-control-sm" min="1" max="12" placeholder="시"/>
                  <span class="input-group-text">:</span>
                  <input type="number" v-model="place.startTime.minute"
                        class="form-control form-control-sm" min="0" max="59" placeholder="분"/>
                  <select v-model="place.startTime.period" class="form-select form-select-sm">
                    <option>AM</option><option>PM</option>
                  </select>
                </div>

                <!-- 종료 시간 -->
                <div v-if="place.useEndTime" class="d-flex align-items-center mt-2">
                  <span class="me-2">~</span>
                  <div class="input-group">
                    <input type="number" v-model="place.endTime.hour"
                    class="form-control form-control-sm" min="1" max="12" placeholder="시"/>
                    <span class="input-group-text">:</span>
                    <input type="number" v-model="place.endTime.minute"
                    class="form-control form-control-sm" min="0" max="59" placeholder="분"/>
                    <select v-model="place.endTime.period" class="form-select form-select-sm">
                      <option>AM</option><option>PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 종료 시간 토글 체크박스 -->
              <div class="d-flex align-items-center ms-3 mt-1">
                <div class="form-check form-switch">
                  <input class="form-check-input"
                        type="checkbox"
                        v-model="place.useEndTime"
                        :id="'useEndTime_' + place.no">
                  <label class="form-check-label" :for="'useEndTime_' + place.no">
                    종료 시간
                  </label>
                </div>
              </div>

              <div class="mt-2">
                <button class="custom-btn btn btn-sm me-1"
                        @click="handleTimeUpdate(place.no, place)">
                  저장
                </button>
                <button class="btn btn-sm btn-outline-secondary"
                        @click="handleResetTime(place.no)">
                  초기화
                </button>
              </div>
            </div>

            <!-- 표시 모드 -->
            <div v-else>
              <span v-if="place.startTime?.hour" class="time-display">
                {{ place.startTime.hour }}:{{ place.startTime.minute.toString().padStart(2, '0') }}
                {{ place.startTime.period }}
                {{ place.useEndTime && place.endTime?.hour ?
                  `- ${place.endTime.hour}:${place.endTime.minute.toString().padStart(2, '0')}
                  ${place.endTime.period}` : '' }}
              </span>
            </div>
          </div>
    </div>
   </div>

   <div v-if="selectedPlaces.length === 0" class="text-center py-4 text-muted">
     이 날짜에 선택된 장소가 없습니다.
   </div>
 </div>
</template>

<style scoped>
.selected-place-item {
  border: 1px solid #e2e8f0;  /* 연한 회색 테두리 */
  border-radius: 8px;         /* 모서리 둥글게 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* 미세한 그림자 추가 */
  transition: all 0.2s ease;  /* 부드러운 효과 */
}

/* 호버 효과를 주고 싶다면 아래 스타일도 추가할 수 있습니다 */
.selected-place-item:hover {
  border-color: #cbd5e1;  /* 호버시 테두리 색상 약간 진하게 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);  /* 호버시 그림자 약간 강화 */
}

.visit-order {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  border: 2px solid white;
}

.time-display {
  color: #666;
  font-size: 0.9em;
}

.custom-btn {
  background-color: #f5f5f5;
}

.custom-btn:hover {
  color: white;
  background-color: #4e46dc;
}

.delete-btn {
  color: #727272;
  background-color: #f5f5f5;
}

.delete-btn:hover {
  color: white;
  background-color: #ff2c2c;
}

.form-check-input:checked {
  background-color: #4e46dc;
  border-color: #4e46dc;
}
</style>
