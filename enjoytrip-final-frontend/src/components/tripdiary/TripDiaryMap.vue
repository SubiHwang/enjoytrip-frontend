<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { listSido, listGugun, listCategory, listAttraction } from '@/api/map';
import AttractionSelect from '@/components/attractions/AttractionSelect.vue';
import AttractionMap from '@/components/attractions/AttractionMap.vue';
import AttractionList from '@/components/attractions/AttractionList.vue';
import TripDiaryMapRoute from '@/components/tripdiary/TripDiaryMapRoute.vue';

// Props 정의
const props = defineProps({
  selectedPlaces: {
    type: Array,
    required: true
  },
  currentSelectedDay: {
    type: Number,
    required: true
  },
  totalDays: {
    type: Array,
    required: true
  },
  readonly: {
    type: Boolean,
    default: true
  }
});

// Emits 정의
const emit = defineEmits([
  'update:selectedPlaces',
  'update:currentSelectedDay',
  'update:totalDays',
  'place-selected',
  'place-removed',
  'day-changed',
  'day-selected',
  'day-added',
  'day-deleted'
]);

// 검색 관련 상태
const sidoList = ref([]);
const gugunList = ref([{text: "구군선택", value: 0}]);
const categoryList = ref([]);

const selectSido = ref(0);
const selectGugun = ref(0);
const selectCategory = ref(0);
const keyword = ref("");

// 선택된 관광지
const selectAttraction = ref({});

// 컨텍스트 메뉴 상태
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  day: null
});

// 초기 데이터 로드
onMounted(() => {
  if(!props.readonly) {
    getSidoList();
    getCategoryList();
  }
});

// API 호출 함수들
const getSidoList = () => {
  listSido(({data}) => {
    sidoList.value = [
      {text: "시도선택", value: 0},
      ...data.map(sido => ({
        text: sido.sidoName,
        value: sido.sidoCode
      }))
    ];
  });
};

const getGugunList = (sidoCode) => {
  listGugun(
    { sidoCode },
    ({ data }) => {
      gugunList.value = [
        { text: "구군선택", value: 0 },
        ...data.map(gugun => ({
          text: gugun.gugunName,
          value: gugun.gugunCode
        }))
      ];
    }
  );
};

const getCategoryList = () => {
  listCategory(({data}) => {
    categoryList.value = [
      {text: "관광지유형선택", value: 0},
      ...data.map(category => ({
        text: category.name,
        value: category.id
      }))
    ];
  });
};

// 관광지 목록 상태
const attractionList = ref([]);

// 검색 조건 변경 시 관광지 목록 업데이트
watch([selectSido, selectGugun, selectCategory, keyword],
  ([sidoCode, gugunCode, category, keyword]) => {
    const params = {};
    if(sidoCode !== 0) params.sidoCode = sidoCode;
    if(gugunCode !== 0) params.gugunCode = gugunCode;
    if(category !== 0) params.category = category;
    if(keyword) params.keyword = keyword;

    listAttraction(params, ({data}) => {
      attractionList.value = data;
    });
  }
);

// 시도 선택 시 구군 목록 업데이트
watch(selectSido, (sidoCode) => {
  selectGugun.value = 0;
  getGugunList(sidoCode);
});

// 이벤트 핸들러
const chooseAttraction = (attraction) => {
  selectAttraction.value = attraction;
};

const handleMarkerClick = (attraction) => {
  emit('place-selected', attraction);
};

const handleRemovePlace = (placeNo) => {
  emit('place-removed', placeNo);
};

const handleUpdateDay = (placeNo, newDay) => {
  emit('day-changed', placeNo, newDay);
};

const handleDaySelect = (day) => {
  emit('day-selected', day);
};

const handleAddDay = () => {
  emit('day-added');
};

const handleDeleteDay = (day) => {
  emit('day-deleted', day);
};

const handleTimeUpdate = (updateData) => {
  const updatedPlaces = props.selectedPlaces.map(place => {
    if (place.no === updateData.placeNo) {
      return {
        ...place,
        isEditing: updateData.isEditing,
        ...(updateData.time && {
          startTime: updateData.time.startTime,
          endTime: updateData.time.endTime
        })
      };
    }
    return place;
  });

  emit('update:selectedPlaces', updatedPlaces);
};

// 컨텍스트 메뉴 관련
const showContextMenu = (event, day) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    day
  };
};

const closeContextMenu = () => {
  contextMenu.value.show = false;
};

const handleClickOutside = (event) => {
  if (contextMenu.value.show) {
    const contextMenuEl = document.querySelector('.context-menu');
    if (contextMenuEl && !contextMenuEl.contains(event.target)) {
      closeContextMenu();
    }
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="container mt-3">
    <!-- 장소 검색 영역 -->
    <div v-if="!readonly" class="search-container bg-light rounded p-4 mb-4">
      <div class="search-inputs d-flex gap-2 mb-3">
        <AttractionSelect
          :selectOption="sidoList"
          v-model:selected="selectSido"
        />
        <AttractionSelect
          :selectOption="gugunList"
          v-model:selected="selectGugun"
        />
        <AttractionSelect
          :selectOption="categoryList"
          v-model:selected="selectCategory"
        />
        <input
          type="text"
          class="form-control"
          v-model.lazy="keyword"
          placeholder="검색어 입력"
        />
      </div>

      <div class="list-wrapper" style="max-height: 400px; overflow-y: auto;">
        <AttractionList
          :attractionList="attractionList"
          @choose-attraction="chooseAttraction"
        />
      </div>
    </div>

    <!-- 지도와 선택된 장소 목록 -->
    <div class="row">
      <!-- 왼쪽: 지도 -->
      <div class="col-6">
        <AttractionMap
          :attractionList="attractionList"
          :selectAttraction="selectAttraction"
          :selectedPlaces="selectedPlaces.filter(place => place.day === currentSelectedDay)"
          :currentDay="currentSelectedDay"
          :onMarkerClick="handleMarkerClick"
          :readonly="readonly"
        />
      </div>

      <!-- 오른쪽: 선택된 장소 목록 -->
      <div class="col-6">
        <div class="d-flex gap-3">
          <!-- 일자별 선택된 장소 목록-->
          <div class="flex-grow-1">
            <TripDiaryMapRoute
              :selectedPlaces="selectedPlaces.filter(place => place.day === currentSelectedDay)"
              :currentDay="currentSelectedDay"
              :readonly=readonly
              @removed-place="handleRemovePlace"
              @update-day="handleUpdateDay"
              @update-time="handleTimeUpdate"
            />
          </div>

          <!-- 일자 선택 영역 -->
          <div class="day-tabs-vertical">
            <div class="tab-container-vertical">
              <div
                v-for="day in totalDays"
                :key="day"
                class="day-tab-item"
                @contextmenu.prevent="showContextMenu($event, day)"
              >
                <button
                  class="tab-button-vertical"
                  :class="{ 'active': currentSelectedDay === day }"
                  @click="handleDaySelect(day)"
                >
                  {{ day }}일차
                </button>
              </div>
              <button
                v-if="!readonly"
                class="tab-button-vertical add-day"
                @click="handleAddDay"
              >
                +
              </button>
            </div>
          </div>

          <!-- 컨텍스트 메뉴 -->
          <div
            v-if="contextMenu.show && !readonly"
            class="context-menu"
            :style="{
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`
            }"
          >
            <button
              class="context-menu-item text-danger"
              @click="handleDeleteDay(contextMenu.day)"
              :disabled="contextMenu.day === 1"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
    border: 1px solid #dee2e6;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.list-wrapper {
    border: 1px solid #dee2e6;
    background: white;
}

.selected-places-container {
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    padding: 1rem;
    background-color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.selected-places-list {
    max-height: 600px;
    overflow-y: auto;
}

.selected-place-item {
    border: 1px solid #dee2e6;
}

.diary-info-container {
    border: 1px solid #dee2e6;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.day-tabs {
    border-bottom: 2px solid #dee2e6;
}

.tab-container {
    gap: 0.5rem;
}

.tab-button {
    padding: 0.5rem 1rem;
    border: 1px solid #dee2e6;
    border-bottom: none;
    border-radius: 0.5rem 0.5rem 0 0;
    background-color: #f8f9fa;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab-button.active {
    background-color: #4f46e5;
    color: white;
    border-color: #4f46e5;
}

.tab-button.add-day {
    background-color: #e5e7eb;
    font-weight: bold;
}

.day-tabs-vertical {
    width: 80px;
    max-height: 600px;
    overflow-y: auto;
    border-left: 2px solid #dee2e6;
    padding-left: 0.5rem;
}

.tab-container-vertical {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tab-button-vertical {
    width: 100%;
    height: 36px;
    padding: 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    background-color: #f8f9fa;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    text-align: center;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tab-button-vertical.active {
    background-color: #f8d33e;
    color: black;
    border-color: #f8d33e;
}

.tab-button-vertical.active:hover{
    background-color: #fbbf24;
    color: black;
    border-color: #fbbf24;
    box-shadow: 0 2px 4px rgba(67, 56, 202, 0.3);
}

.tab-button-vertical.add-day {
    background-color: #e5e7eb;
    font-weight: bold;
    height: 36px;
    font-size: 1.2rem;

}

/* 스크롤바 스타일링 */
.day-tabs-vertical::-webkit-scrollbar {
    width: 6px;
}

.day-tabs-vertical::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.day-tabs-vertical::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

.day-tabs-vertical::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* 음영 효과 - 스크롤이 있음을 표시 */
.day-tabs-vertical {
    position: relative;
}

.day-tabs-vertical::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0));
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
}

.day-tabs-vertical.has-overflow::after {
    opacity: 1;
}

.context-menu {
    position: fixed;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 4px 0;
    min-width: 120px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
}

.context-menu-item {
    display: block;
    width: 100%;
    padding: 8px 16px;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
}

.context-menu-item:hover {
    background-color: #f8f9fa;
}

.context-menu-item:disabled {
    color: #6c757d;
    cursor: not-allowed;
}

.text-danger {
    color: #dc3545;
}

.text-danger:hover {
    background-color: #dc354511;
}
</style>
