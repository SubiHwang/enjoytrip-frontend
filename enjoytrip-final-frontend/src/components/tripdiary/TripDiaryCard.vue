<script setup>
import { likeTripDiaries, unlikeTripDiaries } from "@/api/tripdiary";
import { useRouter } from "vue-router";
import defaultThumbnail from '@/assets/default-thumbnail.svg';
import defaultProfile from '@/assets/default-profile.png'
import heart from '@/assets/heart.svg'
import heartfill from '@/assets/heart-fill.svg'

const router = useRouter();
const emit = defineEmits(['like', 'unlike']);

const props = defineProps({
    diary: {
        type: Object,
        required: true,
        default: () => ({}),
        validator: (diary) => {
            const requiredFields = [
                'id',
                'thumbnailUrl',
                'title',
                'startDate',
                'endDate',
                'writer',
                'like'
            ];
            
            return requiredFields.every(field => field in diary);
        }
    }
});

const handleLikeClick = async (event) => {
  event.stopPropagation();
  
  try {
    if (props.diary.like.isLike) {
      emit('unlike', props.diary.id);
    } else {
      emit('like', props.diary.id);
    }
  } catch (error) {
    console.error("Error handling like:", error);
    alert('요청 처리 중 오류가 발생했습니다.');
  }
};


const navigateToUserProfile = (event) => {
  event.stopPropagation();
  router.push(`/my-diary/${props.diary.writer.id}`);
};

const navigateToDetail = () => {
  router.push(`/trip-diary/${props.diary.id}`);
};
</script>

<template>
    <div class="card title-font" style="width: 22rem;" @click="navigateToDetail">
        <div class="thumbnail-container">
            <div class="thumbnail-wrapper">
                <img :src="diary.thumbnailUrl || defaultThumbnail" class="card-img-top" alt="대표사진">
            </div>
        </div>
        <div class="card-body">
            <!-- Content -->
            <h5 class="card-title">{{ diary.title }}</h5>

            <div class="date-range">
                <span class="date-display">{{ diary.startDate }}</span>
                <span v-if="diary.endDate"> ~ {{ diary.endDate }}</span>
            </div>
            <hr>

            <div class="d-flex justify-content-between align-items-center user-info">
                <!-- Writer -->
                <div 
                    class="d-flex align-items-center gap-2 writer-section"
                    @click="navigateToUserProfile"
                >
                    <img
                        :src="diary.writer.profileUrl || defaultProfile"
                        class="rounded-circle profile-image"
                        alt="프로필 이미지"
                    >
                    <div class="writer-id">
                        <span>by.</span><span>{{ diary.writer.id }}</span>
                    </div>
                </div>

                <!-- like count -->
                <div 
                    class="like-count d-flex align-items-center gap-1"
                    @click="handleLikeClick"
                >
                    <img 
                        :src="diary.like.isLike ? heartfill : heart" 
                        alt="좋아요" 
                        class="like-icon"
                    >
                    <span>{{ diary.like.count }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card-container {
    background-color: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    max-width: 320px;
    cursor: pointer;
}

.card-container:hover {
    transform: translateY(-2px);
}

.thumbnail-container {
    position: relative;
    width: 100%;
    padding: 0.5rem;
}

.thumbnail-wrapper {
    position: relative;
    width: 100%;
    padding-top: 80%;
    overflow: hidden;
    border-radius: 4px;
    background-color: #f8f9fa;
}

.thumbnail-wrapper img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.date-range {
    color: #A6A6A6
}

.writer-section {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 20px;
    transition: background-color 0.2s;
}

.writer-section:hover {
    background-color: #f3f4f6;
}

.writer-id {
    font-size: 15px
}

.profile-image {
    width: 30px;
    height: 30px;
    object-fit: cover;
}

.like-count {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 20px;
    transition: background-color 0.2s;
}

.like-count:hover {
    background-color: #f3f4f6;
}

.like-icon {
    height: 15px;
    transition: transform 0.2s;
}

.like-count:hover .like-icon {
    transform: scale(1.1);
}

.like-count {
    font-size: 15px;
}

.user-info {
    margin-top: 1rem;
}
</style>