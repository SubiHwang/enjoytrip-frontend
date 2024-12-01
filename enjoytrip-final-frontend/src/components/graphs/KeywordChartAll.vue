<template>
  <Bar :data="chartData" :options="options" />
</template>

<script lang="ts">
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { ref, onMounted, defineComponent } from 'vue'
import { getKeywordRankByAll } from '@/api/graph'

// datalabels 플러그인 추가
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels  // 플러그인 등록
)

export default defineComponent({
  name: 'KeywordChartAll',
  components: {
    Bar
  },
  setup() {
    const labels = ref<string[]>([]);
    const datas = ref<number[]>([]);
    const chartData = ref({
      labels: [],
      datasets: [{
        data: [],
        label: '검색 횟수',
        backgroundColor: '#4e46dc80', // 약간의 투명도를 가진 색상
        borderColor: '#4e46dc',       // 진한 테두리 색상
        borderWidth: 1
      }]
    });

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#e2e8f0',
            drawBorder: false
          },
          border: {
            display: false
          },
          ticks: {
            color: '#64748b',
            font: { // 세로축 폰트
              size: 15
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          border: {
            display: false
          },
          ticks: {
            color: '#221F5F',
            font: { // 가로측 폰트
              size: 18,
              weight: 800
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'white',
          titleColor: '#1e293b',
          bodyColor: '#1e293b',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return context.parsed.y.toLocaleString();
            }
          }
        },
        datalabels: {
          color: '#4e46dc',
          anchor: 'end',
          align: 'top',
          offset: 4,
          font: {
            weight: 'bold',
            size: 15
          },
          formatter: (value) => value.toLocaleString()
        }
      }
    };

    const fetchKeywordRankByAll = async () => {
      const response = await getKeywordRankByAll();

      if(response.status === 200) {
        response.data.forEach(item => {
          labels.value.push(item.keyword);
          datas.value.push(item.searchCount);
        });

        chartData.value = {
          labels: labels.value,
          datasets: [{
            data: datas.value,
            label: '검색 횟수',
            backgroundColor: '#6D67DA',  // 보라색 계열로 변경
            hoverBackgroundColor: '#4D46D4',
            borderRadius: 5,  // 모서리를 둥글게
            borderSkipped: false,
            barThickness: 100  // 바의 두께 조정
          }]
        };
      } else {
        alert('서버가 응답하지 않습니다.');
      }
    }

    onMounted(() => {
      fetchKeywordRankByAll();
    });

    return {
      chartData,
      options
    }
  }
})
</script>

<style scoped>
</style>
