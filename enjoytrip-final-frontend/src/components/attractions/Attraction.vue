<script setup>
import {ref, watch, onMounted} from 'vue';
import {listSido, listGugun, listCategory, listAttraction} from '@/api/map';

import AttractionSelect from '@/components/attractions/AttractionSelect.vue';
import AttractionMap from '@/components/attractions/AttractionMap.vue';
import AttractionList from '@/components/attractions/AttractionList.vue';

const sidoList = ref([]);
const gugunList = ref([{text: "구군선택", value: 0}]);
const categoryList = ref([]);

const selectSido = ref(0);
const selectGugun = ref(0);
const selectCategory = ref(0);
const keyword = ref("");

const attractionList = ref([]);
const selectAttraction = ref({});

onMounted(() => {
    getSidoList();
    getCategoryList();
})

// 시도 리스트를 불러온다.
const getSidoList = () => {
    listSido(
        ({data}) => {
            let options = [];
            options.push({text: "시도선택", value: 0});
            data.forEach((sido) => {
                options.push({text: sido.sidoName, value: sido.sidoCode})
            });
            sidoList.value = options;
        }
    )
}

// 구군 리스트를 불러온다.
const getGugunList = (sidoCode) => {
    listGugun(
    { sidoCode },
    ({ data }) => {
        let options = []
        options.push({ text: "구군선택", value: 0 })
        data.forEach((gugun) => {
            options.push({ text: gugun.gugunName, value: gugun.gugunCode })
        })
        gugunList.value = options
        }
    )
}

// 관광지 유형 리스트를 불러온다.
const getCategoryList = () => {
    listCategory(
        ({data}) => {
            let options = [];
            options.push({text: "관광지유형선택", value: 0});
            data.forEach((category) => {
                options.push({text: category.name, value: category.id})
            });
            categoryList.value = options;
        }
    )
}

// 시도를 선택한 경우, 구군 리스트를 업데이트한다.
watch(selectSido, (sidoCode) => {
    selectGugun.value = 0;
    getGugunList(sidoCode);
});

// 시도, 구군, 카테고리, 키워드를 선택한 경우, 관광지 리스트를 업데이트한다.
watch([selectSido, selectGugun, selectCategory, keyword], ([sidoCode, gugunCode, category, keyword]) => {
    const params = {};

    if(sidoCode !== 0) params.sidoCode = sidoCode;
    if(gugunCode !== 0) params.gugunCode = gugunCode;
    if(category !== 0) params.category = category;
    if(keyword) params.keyword = keyword;

    listAttraction(
        params,
        ({data}) => {
            attractionList.value = data;
        }
    )
});

// 관광지를 선택하면 지도에 포커싱된다.
const chooseAttraction = (attraction) => {
    selectAttraction.value = attraction;
}

</script>

<template>
    <div class="container mt-3">
        <h3 class="title-font text-center mb-4">전국 관광지 조회</h3>
        <div class="search-container bg-light rounded p-4 mb-4">
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
                <AttractionList :attractionList="attractionList"  @choose-attraction="chooseAttraction"/>
            </div>
        </div>
        <AttractionMap :attractionList="attractionList" :selectAttraction="selectAttraction"/>
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
</style>
