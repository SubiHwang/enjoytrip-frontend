<script setup>
import { authAxios } from "@/util/http-commons";
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue"; // onMounted 추가
import { storeToRefs } from "pinia";
import defaultProfile from "@/assets/default-profile.png"; // 기본 프로필 이미지 import
import { useUserStore } from "@/stores/user-store";

const router = useRouter();
const api = authAxios();
const isLoading = ref(false); // isLoading 추가

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
// 이미지 미리보기 URL
const previewImage = ref(userInfo.value?.profileUrl || defaultProfile);

const imageInput = ref(null); // 파일 입력 ref

// form으로 변경하고 ModifyRequestDto와 맞춤
const profileForm = ref({
  userId: "", // 추가: 백엔드에서 필요할 수 있음
  userName: "",
  userPassword: "",
  passwordConfirm: "", // 프론트엔드 전용
  emailId: "",
  emailDomain: "",
  profileUrl: "", // 추가
});

const fetchProfileInfo = async () => {
  try {
    isLoading.value = true;
    const response = await api.post("/member/myProfile");
    if (response.data) {
      // 받아온 데이터로 폼 초기화
      const { passwordConfirm, ...userData } = response.data;
      profileForm.value = {
        ...userData,
        passwordConfirm: "", // 비밀번호 확인은 빈 값으로
      };

      // 프로필 URL이 있으면 미리보기 업데이트
      previewImage.value = userData.profileUrl || defaultProfile;
    }
  } catch (error) {
    console.error("사용자 정보 로드 실패:", error?.response || error);
  } finally {
    isLoading.value = false;
  }
};

// 이미지 선택 핸들러
// 파일 선택되면 imageInput.value.files[0]에 파일 저장됨
const handleImageSelect = (event) => {
  // files[0]는 사용자가 선택한 첫번째(보통 하나만 선택) 파일을 의미
  const file = event.target.files[0];
  if (file) {
    // 파일 크기 체크 (예: 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    // 이미지 타입 체크
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// 이미지 처리 관련 코드 수정
const handleSubmit = async (e) => {
  e.preventDefault();

  if (profileForm.value.userPassword !== profileForm.value.passwordConfirm) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  try {
    const formData = new FormData(); // HTML form 데이터를 key-value 쌍으로 쉽게 전송할 수 있게 해주는 객체

    // 이미지 파일이 있으면 추가
    if (imageInput.value?.files[0]) {
      formData.append("file", imageInput.value.files[0]);
    }

    // DTO 데이터 추가
    //서버로 보내기 위해 profileForm에서 필요한 데이터만 복사해서 만든 새로운 객체
    const memberDto = { ...profileForm.value };
    delete memberDto.passwordConfirm;
    delete memberDto.profileUrl; // 불필요한 필드 제거

    // FormData에 DTO 추가하는 부분
    // formData.append(
    //   "file", // 서버의 @RequestPart 이름과 일치
    //   new Blob([JSON.stringify(memberDto)], {
    //     // JSON 데이터를 Blob으로 변환
    //     type: "application/json", // Content-Type 지정
    //   })
    // )

    formData.append("file", imageInput.value.files[0]); // 파일
    //첫 번째 파라미터는 항상 name(키값)이어야 해서 "memberDto"가 먼저
    formData.append(
      "memberDto",
      new Blob([JSON.stringify(memberDto)], {
        type: "application/json",
      })
    );

    // API 요청
    const response = await api.put("/member/", formData, {
      headers: {
        "Content-Type": "multipart/form-data", // 파일 업로드를 위한 헤더
      },
    });

    if (response.status === 200) {
      alert("회원 정보가 수정되었습니다!");
      router.push(`/my-diary/${profileForm.value.userId}`);
    }
  } catch (error) {
    console.error("회원 정보 수정 실패:", error);
    alert(
      error.response?.status === 404
        ? "회원 정보를 찾을 수 없습니다."
        : "회원 정보 수정 중 오류가 발생했습니다."
    );
  }
};

// 성별 옵션
const genderOptions = [
  { value: "0", label: "남성" },
  { value: "1", label: "여성" },
];

onMounted(() => {
  fetchProfileInfo();
});
</script>

<template>
  <div class="container mt-5">
    <form @submit="handleSubmit" class="form-wrapper">
      <h2 class="text-center mb-5 title-font">회원 정보 수정</h2>

      <!-- 프로필 이미지 섹션 -->
      <div class="text-center mb-5">
        <div class="profile-image-container mx-auto mb-3">
          <img
            :src="previewImage"
            :alt="userInfo?.userId || '프로필 이미지'"
            class="profile-image"
            @error="(e) => (e.target.src = defaultProfile)"
          />
          <div class="image-overlay">
            <label for="profile-image" class="upload-label">📷</label>
          </div>
        </div>
        <input
          type="file"
          id="profile-image"
          ref="imageInput"
          @change="handleImageSelect"
          accept="image/*"
          class="d-none"
        />
      </div>

      <!-- 이름 입력 -->
      <div class="input-group mb-4">
        <input
          type="text"
          class="form-control"
          placeholder="이름을 입력해주세요"
          v-model="profileForm.userName"
        />
      </div>

      <!-- 비밀번호 입력 -->
      <div class="input-group mb-4">
        <input
          type="password"
          class="form-control"
          placeholder="새 비밀번호를 입력해주세요"
          v-model="profileForm.userPassword"
        />
      </div>

      <!-- 비밀번호 확인 -->
      <div class="input-group mb-4">
        <input
          type="password"
          class="form-control"
          placeholder="비밀번호를 한 번 더 입력해주세요"
          v-model="profileForm.passwordConfirm"
        />
      </div>

      <!-- 이메일 입력 -->
      <div class="input-group mb-4">
        <input
          type="text"
          class="form-control"
          placeholder="이메일"
          v-model="profileForm.emailId"
        />
        <span class="input-group-text">@</span>
        <input
          type="text"
          class="form-control"
          v-model="profileForm.emailDomain"
        />
      </div>

      <!-- 성별 선택 -->
      <div class="input-group mb-4">
        <select class="form-control" v-model="profileForm.gender">
          <option
            v-for="option in genderOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- 생년월일 -->
      <div class="input-group mb-5">
        <input type="date" class="form-control" v-model="profileForm.birth" />
      </div>

      <!-- 수정하기 버튼 -->
      <button @click="handleUpdate" class="btn-update">수정하기</button>
    </form>
  </div>
</template>

<style scoped>
/* 폼 래퍼 */
.form-wrapper {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

/* 프로필 이미지 관련 스타일 */
.profile-image-container {
  width: 150px;
  height: 150px;
  margin: 0 auto;
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #ddd;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 50%;
  cursor: pointer;
}

.profile-image-container:hover .image-overlay {
  opacity: 1;
}

.upload-label {
  color: white;
  cursor: pointer;
  font-size: 24px;
}

/* 입력 폼 관련 스타일 */
.input-group {
  width: 100%;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: none;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.form-control:disabled {
  background-color: #f0f0f0;
  color: #666;
}

/* 이메일 입력 그룹 */
.input-group .input-group-text {
  background-color: #f5f5f5;
  border: none;
  color: #666;
}

/* 셀렉트 박스 스타일 */
select.form-control {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
}

/* 날짜 입력 스타일 */
input[type="date"].form-control {
  padding-right: 12px;
}

/* 업데이트 버튼 */
.btn-update {
  width: 100%;
  padding: 12px;
  background-color: #f8d33e;
  color: black;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-update:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-update:active {
  transform: translateY(0);
}

/* 제목 스타일 */
h2 {
  font-weight: 600;
  color: #333;
  margin-bottom: 2rem;
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .form-wrapper {
    padding: 15px;
  }

  .profile-image-container {
    width: 120px;
    height: 120px;
  }
}

/* 애니메이션 */
.profile-image-container,
.form-control,
.btn-update {
  transition: all 0.3s ease;
}

/* 포커스 효과 */
.form-control:focus {
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  outline: none;
}

/* 에러 상태 */
.form-control.is-invalid {
  background-color: #fff1f1;
  border: 1px solid #dc3545;
}

/* 성공 상태 */
.form-control.is-valid {
  background-color: #f1fff1;
  border: 1px solid #28a745;
}
</style>
