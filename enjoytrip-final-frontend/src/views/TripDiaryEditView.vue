<script setup>
import TripDiaryMap from '@/components/tripdiary/TripDiaryMap.vue';
import TripDiaryContent from '@/components/tripdiary/TripDiaryContent.vue';
import { saveTripDiary, readTripDiary, updateTripDiary } from '@/api/tripdiary'

import { useRoute, useRouter } from 'vue-router';

import { ref, onMounted } from 'vue';

const route = useRoute();
const router = useRouter();

const diaryId = route.params.diaryId;

const useMap = ref(true);
const useEndDate = ref(false);
const title = ref('');
const content = ref('');
const thumbnailUrl = ref('');
const startDate = ref('');
const endDate = ref('');

const selectedPlaces = ref([]);
const currentSelectedDay = ref(1);
const totalDays = ref([1]);

onMounted(() => {
  if(diaryId) {
    getTripDiary(diaryId);
  }
});

const getTripDiary = async (diaryId) => {
    try {
        const { data } = await readTripDiary(diaryId);

        useMap.value = data.hasMap;
        useEndDate.value = data.endDate === null ? false : true;
        title.value = data.title;
        content.value = data.content;
        thumbnailUrl.value = data.thumbnailUrl;
        startDate.value = data.startDate;
        endDate.value = data.endDate;
        totalDays.value = Array.from({ length: data.totalDays }, (_, i) => i + 1);

        data.tripRoutes.forEach(tripRoute => {
          const parseTime = (timeStr) => {
            if (!timeStr) return { hour: '', minute: '', period: 'AM' };
            const [time, period] = timeStr.split(' ');
            const [hour, minute] = time.split(':');
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
            ...tripRoute.attraction
          });
        });
      } catch (error) {
        console.error('Error loading diary:', error);
    }
};

// 새로운 장소를 선택된 장소 목록에 추가
const handlePlaceSelection = (place) => {
  selectedPlaces.value.push({
    ...place,
    day: currentSelectedDay.value,
    visitOrder: selectedPlaces.value.filter(p => p.day === currentSelectedDay.value).length + 1,
    startTime: { hour: '', minute: '', period: 'AM' },
    endTime: { hour: '', minute: '', period: 'AM' },
    isEditing: false,
  });
};

// 선택된 장소를 제거하고 방문 순서 재정렬
const handlePlaceRemoval = (placeNo) => {
  const index = selectedPlaces.value.findIndex(place => place.no === placeNo);
  if (index > -1) {
    selectedPlaces.value.splice(index, 1);
    reorderPlaces();
  }
};

// 대표 이미지 URL 업데이트 핸들러 추가
const handleThumbnailUpdate = (newThumbnailUrl) => {
  thumbnailUrl.value = newThumbnailUrl;
};

// 선택된 장소의 일자 변경
const handleDayChange = (placeNo, newDay) => {
  const place = selectedPlaces.value.find(p => p.id === placeNo);
  if (place) {
    place.day = newDay;
    reorderPlaces();
  }
};

// 현재 선택된 일자 업데이트
const handleDaySelection = (day) => {
  currentSelectedDay.value = day;
};

// 새로운 일자 추가
const handleAddDay = () => {
  const newDay = totalDays.value.length + 1;
  totalDays.value.push(newDay);
  currentSelectedDay.value = newDay;
};

// 선택된 일자 삭제 (1일차는 삭제 불가)
const handleDeleteDay = (dayToDelete) => {
  if (dayToDelete === 1) return;

  // 선택된 장소들 업데이트
  selectedPlaces.value = selectedPlaces.value
    .filter(place => place.day !== dayToDelete)
    .map(place => ({
      ...place,
      day: place.day > dayToDelete ? place.day - 1 : place.day
    }));

  // 일차 배열 순차적으로 재생성
  totalDays.value = Array.from(
    { length: totalDays.value.length - 1 },
    (_, i) => i + 1
  );

  // 현재 선택된 일차 업데이트
  currentSelectedDay.value = Math.min(dayToDelete - 1, totalDays.value.length);
};

// 각 일자별로 장소들의 방문 순서 재정렬
const reorderPlaces = () => {
  const placesByDay = {};
  selectedPlaces.value.forEach(place => {
    if (!placesByDay[place.day]) placesByDay[place.day] = [];
    placesByDay[place.day].push(place);
  });

  Object.values(placesByDay).forEach(places => {
    places.forEach((place, idx) => {
      place.visitOrder = idx + 1;
    });
  });
};

// 여행일기 저장 함수
const handleSave = async () => {
  if (!title.value) {
    alert('제목과 내용을 입력해주세요');
    return;
  }

  if(!content.value) {
    alert('내용을 입력해주세요');
    return;
  }

  if(!startDate.value) {
    alert('시작일을 입력해주세요');
    return;
  }

  const tripData = {
    title: title.value,
    content: content.value,
    thumbnailUrl: thumbnailUrl.value,
    startDate: startDate.value,
    endDate: useEndDate.value ? endDate.value : null,
    useMap: useMap.value,
    places: selectedPlaces.value,
    totalDays: totalDays.value.length
  };

  try {
    let response = null, createdDiaryId = null;
    if(diaryId) {
      response = await updateTripDiary(diaryId, tripData);
    } else {
      response = await saveTripDiary(tripData);

      if(response.status == 200) {
        createdDiaryId = response.data.diaryId;
      }
    }

    if(response.status === 200) {
      alert("저장되었습니다.");
      router.replace(`/trip-diary/${createdDiaryId}`);
    } else {
      alert("저장에 실패했습니다.");
    }
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div class="container mt-3">
    <!-- Title input -->
    <div class="title title-font">
      <input type="text" v-model="title" placeholder="제목을 입력하세요">
    </div>

    <!-- Date Range input -->
    <div class="date-range mt-3">
      <div class="d-flex align-items-center gap-3">
        <div class="date-input">
          <input
            type="date"
            v-model="startDate"
            class="form-control"
            :max="endDate"
          >
        </div>

        <div class="date-input" v-if="useEndDate">
          <input
            type="date"
            v-model="endDate"
            class="form-control"
            :min="startDate"
          >
        </div>

        <div class="d-flex align-items-center">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              v-model="useEndDate"
              id="useEndDate"
            >
            <label class="form-check-label" for="useEndDate">
              종료일 추가
            </label>
          </div>
        </div>
      </div>
    </div>

    <hr>

    <!-- Map controls -->
    <div class="row d-flex justify-content-between align-items-center mt-3">
      <div class="col-auto">
        <select class="useMap-form form-select form-select-sm" v-model="useMap">
          <option :value="true">지도 사용</option>
          <option :value="false">지도 미사용</option>
        </select>
      </div>
      <div class="col-auto">
        <button class="btn edit-btn" @click="handleSave">저장</button>
      </div>
    </div>

    <!-- Map component -->
    <div v-if="useMap">
      <TripDiaryMap
        v-model:selectedPlaces="selectedPlaces"
        v-model:currentSelectedDay="currentSelectedDay"
        v-model:totalDays="totalDays"
        :readonly="false"
        @place-selected="handlePlaceSelection"
        @place-removed="handlePlaceRemoval"
        @day-changed="handleDayChange"
        @day-selected="handleDaySelection"
        @day-added="handleAddDay"
        @day-deleted="handleDeleteDay"
      />
    </div>

    <!-- Content input -->
    <div class="content mt-4">
      <TripDiaryContent
        v-model:content="content"
        v-model:thumbnailUrl="thumbnailUrl"
        @update:thumbnailUrl="handleThumbnailUpdate"
      />
    </div>
  </div>
</template>

<style scoped>
.title input {
 border: none;
 outline: none;
 width: 100%;
 padding: 8px;
 font-size: 35px;
 background-color: transparent;
}

.useMap-form {
  width: fit-content;
}

.content textarea {
 border: none;
 outline: none;
 width: 100%;
 background-color: transparent;
 padding: 12px;
}

.content textarea:focus {
 box-shadow: none;
 border-color: #4f46e5;
}

.date-range input[type="date"] {
  border: 1px solid #ddd;
  padding: 4px 8px;
  border-radius: 4px;
}

.date-range input[type="date"]:focus {
  border-color: #4e46dc;
  outline: none;
}

.form-check-input:checked {
  background-color: #4e46dc;
  border-color: #4e46dc;
}

.edit-btn {
  background-color: #4e46dc;
  color: white;
}

.edit-btn:hover {
  background-color: #3730a3;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(67, 56, 202, 0.3);
}
</style>
