<script setup>
import baseImage from '@/assets/base-attraction-image.svg';

defineProps({
   attractionList: Array
});

const emit = defineEmits(['choose-attraction']);

const chooseAttraction = (attraction) => {
  emit('choose-attraction', attraction);
}

</script>

<template>
    <table v-if="attractionList.length" class="table table-hover mb-0">
       <thead>
           <tr class="text-center">
               <th scope="col">사진</th>
               <th scope="col">관광지명</th>
               <th scope="col">주소</th>
           </tr>
       </thead>
       <tbody>
           <tr
               class="text-center"
               v-for="attraction in attractionList"
               :key="attraction.no"
               @click="chooseAttraction(attraction)"
               style="cursor: pointer;"
           >
           <td style="width: 150px">
            <img
                :src="attraction.image || baseImage"
                alt="관광지 대표사진"
                class="img-thumbnail"
                style="width: 60px; height: 60px; object-fit: cover;"
            />
            </td>
            <td class="text-center align-middle">
                <div class="fw-bold">{{ attraction.title }}</div>
            </td>
            <td class="align-middle">{{ attraction.addr }}</td>
           </tr>
       </tbody>
   </table>
   <div v-else class="text-center p-5 text-muted">
      <div class="mb-3">😊</div>
      <span class="title-font">관광지 정보를 입력해주세요</span>
  </div>
</template>
