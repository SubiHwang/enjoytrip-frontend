<script setup>
import { ref, watch, onMounted } from 'vue';
import { uploadImage } from '@/api/file';

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:content', 'update:thumbnailUrl']);

const editor = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);

const updateThumbnailFromContent = () => {
  if (!editor.value) return;

  const firstImage = editor.value.querySelector('img');
  emit('update:thumbnailUrl', firstImage ? firstImage.src : null);
};

watch(() => props.content, (newContent) => {
  if (editor.value && newContent !== editor.value.innerHTML) {
    editor.value.innerHTML = newContent;
    updateThumbnailFromContent();
  }
});

onMounted(() => {
  if (editor.value) {
    editor.value.innerHTML = props.content || '';
    updateThumbnailFromContent();
  }
});

const handleInput = () => {
  if (editor.value) {
    emit('update:content', editor.value.innerHTML);
    updateThumbnailFromContent();
  }
};

const handleDrop = async (event) => {
  event.preventDefault();
  const files = event.dataTransfer.files;

  const dropPoint = document.caretRangeFromPoint(event.clientX, event.clientY);
  if (dropPoint) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(dropPoint);
  }

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      await handleImageUpload(file);
    }
  }
};

const handlePaste = async (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;

  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      const file = item.getAsFile();
      await handleImageUpload(file);
      event.preventDefault();
    }
  }
};

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 500;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', 0.7);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const handleImageUpload = async (file) => {
  try {
    isUploading.value = true;
    uploadProgress.value = 0;

    const compressedFile = await compressImage(file);

    const response = await uploadImage(
      compressedFile,
      (response) => {
        return response;
      },
      (error) => {
        console.error('이미지 업로드 실패:', error);
        throw error;
      }
    );

    if (response?.data?.imageUrl) {
      insertImageAtCursor(response.data.imageUrl);
      handleInput();
    }
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    alert('이미지 업로드에 실패했습니다.');
  } finally {
    isUploading.value = false;
    uploadProgress.value = 0;
  }
};

const insertImageAtCursor = (imageUrl) => {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);

  const img = document.createElement('img');
  img.src = imageUrl;
  img.className = 'uploaded-image';

  range.deleteContents();
  range.insertNode(img);

  const br = document.createElement('br');
  range.setStartAfter(img);
  range.insertNode(br);

  range.setStartAfter(br);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
};
</script>

<template>
  <div class="editor-container">
    <div v-if="thumbnailUrl" class="featured-image-preview mb-4">
      <img :src="thumbnailUrl" alt="대표 이미지" class="featured-preview" />
      <div class="featured-label">대표 사진</div>
    </div>

    <div
      ref="editor"
      class="editor"
      contenteditable="true"
      @paste="handlePaste"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @input="handleInput"
    />

    <div v-if="isUploading" class="upload-status">
      이미지 업로드 중... {{ uploadProgress }}%
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  position: relative;
  width: 100%;
}

.editor {
  width: 100%;
  min-height: 300px;
  border: 1px solid #ccc;
  padding: 10px;
  outline: none;
  line-height: 1.5;
  background-color: white;
  overflow-x: auto; /* 가로 스크롤 추가 */
  word-break: break-word; /* 긴 텍스트 줄바꿈 */
}

.editor:empty::before {
  content: '내용을 입력하세요';
  color: #999;
}

.editor:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.upload-status {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  z-index: 1000;
}

.uploaded-image {
  max-width: 100%; /* 이미지가 에디터 너비를 넘지 않도록 수정 */
  height: auto;
  display: block;
  border-radius: 4px;
  margin: 8px 0;
}

/* 이미지 컨테이너 스타일 */
.image-container {
  width: 100%;
  overflow-x: auto; /* 필요한 경우 가로 스크롤 */
  margin: 8px 0;
}

.featured-image-preview {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}

.featured-preview {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.featured-label {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #4a90e2;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
