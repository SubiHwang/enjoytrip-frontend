<script setup>
import { ref, watch, onMounted, h, render } from "vue";
import InfoWindow from './AttractionMapInfoWindow.vue';

// 전역 변수 선언
var map;
let clusterer;
const positions = ref([]);
const markers = ref([]);
const infowindows = ref([]);
let polylines = [];
let orderMarkers = [];
let openInfowindow = null;

// 마커 색상 배열 정의
const markerColors = [
  '#1abc9c',  // 터키색
  '#9b59b6',  // 보라색
  '#e74c3c',  // 빨간색
  '#3498db',  // 파란색
  '#2ecc71',  // 초록색
  '#f1c40f'   // 노란색
];

const props = defineProps({
  attractionList: Array,
  selectAttraction: Object,
  selectedPlaces: Array,
  currentDay: {
    type: Number,
    required: true,
    default: 1
  },
  readonly: {
    type: Boolean,
    default: true
  },
  onMarkerClick: {
    type: Function,
    default: () => {}
  }
});

// 마커 제거 함수를 먼저 정의
const deleteMarkers = () => {
  if (markers.value.length > 0) {
    clusterer?.clear();
    markers.value.forEach(marker => marker.setMap(null));
    markers.value = [];
  }
};

// 마커 로드 함수를 먼저 정의
const loadMarkers = () => {
  const openedAttractionId = openInfowindow?.getContent()?.getAttribute('data-attraction-id');

  deleteMarkers();
  infowindows.value = [];

  if (!map) return;

  const level = map.getLevel();
  const bounds = map.getBounds();

  const visiblePositions = positions.value.filter(position =>
    bounds.contain(position.latlng)
  );

  if (level >= 5) {
    markers.value = visiblePositions.map(position => {
      const marker = new kakao.maps.Marker({
        position: position.latlng,
        title: position.title
      });

      const infowindow = new kakao.maps.InfoWindow({
        content: createInfowindowContent(position.attraction),
        removable: true,
        zIndex: 1
      });

      infowindows.value.push(infowindow);

      // 이전에 열려있던 인포윈도우 다시 열기
      if (openedAttractionId && position.attraction.id === Number(openedAttractionId)) {
        infowindow.open(map, marker);
        openInfowindow = infowindow;
      }

      kakao.maps.event.addListener(
        marker,
        'click',
        showInfowindow(marker, infowindow, position.attraction)
      );

      return marker;
    });
    clusterer.addMarkers(markers.value);
  } else {
    const limitedPositions = visiblePositions.slice(0, 300);
    markers.value = limitedPositions.map(position => {
      const marker = new kakao.maps.Marker({
        map: map,
        position: position.latlng,
        title: position.title
      });

      const infowindow = new kakao.maps.InfoWindow({
        content: createInfowindowContent(position.attraction),
        removable: false,  // removable 옵션을 false로 변경
        zIndex: 1
      });

      infowindows.value.push(infowindow);

      // 이전에 열려있던 인포윈도우 다시 열기
      if (openedAttractionId && position.attraction.id === Number(openedAttractionId)) {
        infowindow.open(map, marker);
        openInfowindow = infowindow;
      }

      kakao.maps.event.addListener(
        marker,
        'click',
        showInfowindow(marker, infowindow, position.attraction)
      );

      return marker;
    });
  }
};

// 인포윈도우 컨텐츠 생성 함수
const createInfowindowContent = (attraction) => {
  const container = document.createElement('div');
  container.setAttribute('data-attraction-id', attraction.id);
  const vnode = h(InfoWindow, {
    attraction,
    readonly: props.readonly,
    onSelect: (attraction) => {
      openInfowindow?.close();
      openInfowindow = null;
      props.onMarkerClick(attraction);
    }
  });
  render(vnode, container);
  return container;
};

onMounted(() => {
  if (window.kakao && window.kakao.maps) {
    initMap();
  } else {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${
      import.meta.env.VITE_KAKAO_MAP_SERVICE_KEY
    }&libraries=services,clusterer`;
    script.onload = () => kakao.maps.load(() => initMap());
    document.head.appendChild(script);
  }
});

// 지도 초기화 함수
const initMap = () => {
  const container = document.getElementById("map");
  const options = {
    center: new kakao.maps.LatLng(33.450701, 126.570667),
    level: 3,
  };
  map = new kakao.maps.Map(container, options);

  clusterer = new kakao.maps.MarkerClusterer({
    map: map,
    averageCenter: true,
    minLevel: 5,
    disableClickZoom: true,
    styles: [{
      width: '50px',
      height: '50px',
      background: 'rgba(79, 70, 229, 0.8)',
      color: '#fff',
      textAlign: 'center',
      lineHeight: '50px',
      borderRadius: '25px',
      fontSize: '14px',
      fontWeight: 'bold'
    }]
  });

  // 지도 이벤트 리스너들
  kakao.maps.event.addListener(map, 'zoom_changed', () => {
    const level = map.getLevel();
    if (level >= 5) {
      clusterer.setMap(map);
    } else {
      clusterer.setMap(null);
    }
    loadMarkers();
  });

  kakao.maps.event.addListener(map, 'dragend', () => {
    loadMarkers();
  });

  // 중심 좌표 변경 시에도 마커 업데이트
  kakao.maps.event.addListener(map, 'center_changed', () => {
    loadMarkers();
  });

  // 마우스 클릭 시 인포윈도우 닫힘
  kakao.maps.event.addListener(map, 'click', () => {
   if (openInfowindow) {
     openInfowindow.close();
     openInfowindow = null;
   }
 });
};

// 인포윈도우를 표시하는 함수
const showInfowindow = (marker, infowindow, attraction) => {
  return () => {
    if (openInfowindow) {
      openInfowindow.close();
    }
    infowindow.open(map, marker);
    openInfowindow = infowindow;
  };
};

// 기존 선 제거 함수
const clearPolylines = () => {
    polylines.forEach(line => line.setMap(null));
    polylines = [];
};

// 순서 마커 제거 함수
const clearOrderMarkers = () => {
  orderMarkers.forEach(marker => marker.setMap(null));
  orderMarkers = [];
};

// 선택된 관광지가 변경될 때 지도 중심 이동 및 마커 업데이트
watch(
  () => props.selectAttraction,
  (newAttraction) => {
    if (!newAttraction) return;
    var moveLatLon = new kakao.maps.LatLng(newAttraction.latitude, newAttraction.longitude);
    map.panTo(moveLatLon);

    // 지도 이동 후 마커 업데이트
    loadMarkers();
  },
  { deep: true }
);

// 관광지 목록이 변경될 때 마커 새로 생성
watch(
  () => props.attractionList,
  (newAttractionList) => {
    if (!newAttractionList) return;

    positions.value = [];
    newAttractionList.forEach((attraction) => {
      positions.value.push({
        latlng: new kakao.maps.LatLng(attraction.latitude, attraction.longitude),
        title: attraction.title,
        attraction: attraction
      });
    });
    loadMarkers();
  },
  { deep: true, immediate: true }
);

// 방문 관광지 목록이 변경될 때 선 새로 생성
watch(
 [() => props.selectedPlaces, () => props.currentDay],
 ([newSelectedPlaces, currentDay]) => {
   clearPolylines();
   clearOrderMarkers();

   if (!map || !newSelectedPlaces) return;

   const currentDayPlaces = newSelectedPlaces
     .filter(place => Number(place.day) === Number(currentDay))
     .sort((a, b) => Number(a.visitOrder) - Number(b.visitOrder));

   if (currentDayPlaces.length >= 1) {
     const bounds = new kakao.maps.LatLngBounds();
     let maxDistance = 0;
     
     currentDayPlaces.forEach((place, i) => {
       const position = new kakao.maps.LatLng(place.latitude, place.longitude);
       bounds.extend(position);
       
       if (i > 0) {
         const prevPosition = new kakao.maps.LatLng(
           currentDayPlaces[i-1].latitude,
           currentDayPlaces[i-1].longitude
         );
         const distance = getDistance(prevPosition, position);
         maxDistance = Math.max(maxDistance, distance);
       }
     });

     // 2개 이상일 때 회색 점선 그리기
     if (currentDayPlaces.length >= 2) {
       const linePath = currentDayPlaces.map(place =>
         new kakao.maps.LatLng(place.latitude, place.longitude)
       );

       const polyline = new kakao.maps.Polyline({
         path: linePath,
         strokeWeight: 3,
         strokeColor: '#808080', // 회색으로 변경
         strokeOpacity: 0.8,
         strokeStyle: 'dashed' // 점선으로 변경
       });

       polyline.setMap(map);
       polylines.push(polyline);
     }

     // 순서 마커 추가 (색상 변경)
     currentDayPlaces.forEach((place, index) => {
       const position = new kakao.maps.LatLng(place.latitude, place.longitude);

       const content = document.createElement('div');
       content.className = 'order-marker';
       content.innerHTML = `
         <div class="order-circle" style="
           background-color: ${markerColors[index % markerColors.length]};
           color: white;
           width: 28px;
           height: 28px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           font-weight: bold;
           font-size: 14px;
           border: 2px solid white;
           box-shadow: 0 2px 4px rgba(0,0,0,0.2);
         ">
           ${index + 1}
         </div>
       `;

       const orderMarker = new kakao.maps.CustomOverlay({
         position: position,
         content: content,
         zIndex: 3,
         yAnchor: 0.5
       });

       orderMarker.setMap(map);
       orderMarkers.push(orderMarker);
     });

     // 거리에 따른 적절한 줌 레벨 설정
     map.setBounds(bounds);
     
     let additionalZoom = 0;
     if (maxDistance > 20000) {
       additionalZoom = 1;
     } else if (maxDistance < 2000) {
       additionalZoom = -1;
     }
     
     const currentLevel = map.getLevel();
     map.setLevel(currentLevel + additionalZoom);
   }
 },
 { deep: true }
);


// 두 지점 간의 거리를 계산하는 함수 (미터 단위)
function getDistance(pos1, pos2) {
  const lat1 = pos1.getLat();
  const lon1 = pos1.getLng();
  const lat2 = pos2.getLat();
  const lon2 = pos2.getLng();
  
  const R = 6371; // 지구의 반경 (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // 미터 단위로 변환
  
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

</script>

<template>
  <div id="map" :class="{ 'map-diary': readonly === true }"></div>
</template>

<style>
#map {
  width: 100%;
  height: 700px;
}

/* 일기 모드일 때의 지도 높이 조정 */
.map-diary {
  height: 600px;
}

.cluster:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease-in-out;
}

.order-marker {
  position: absolute;
  transform: translate(-50%, -50%);
}

.order-circle {
  transition: transform 0.2s ease;
}

.order-circle:hover {
  transform: scale(1.2);
}

</style>
