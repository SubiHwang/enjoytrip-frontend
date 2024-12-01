<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { authAxios } from "@/util/http-commons";

const router = useRouter();
const api = authAxios();

// 폼 데이터 정의
const formData = reactive({
  userId: "",
  userName: "",
  userPassward: "",
  passwordConfirm: "",
  birth: "",
  gender: "",
  email: "",
});

// 폼 제출 처리
const handleSubmit = async () => {
  try {
    //비밀번호 확인
    // if (formData.userPassword !== formData.passwordConfirm) {
    //   alert("비밀번호가 일치하지 않습니다.");
    //   return;
    // }

    // API 요청 데이터 형식에 맞게 변환
    const requestData = {
      userId: formData.userId,
      userName: formData.userName,
      userPassword: formData.userPassword,
      emailId: formData.emailId,
      emailDomain: formData.emailDomain,
      gender: formData.gender,
      birth: formData.birth,
    };


    // API 호출
    const response = await api.post("/member/", requestData);

    if (response.status === 200) {
      alert("회원가입이 완료되었습니다.");
    }
  } catch (error) {
    console.error("회원가입 에러:", error);
    alert("회원가입 중 오류가 발생했습니다.");
  }
  // 회원가입 성공 시 로그인 페이지로 이동
  router.push("/");
};
</script>
<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h2 class="text-center mb-4">회원 가입</h2>
        <p class="text-center mb-5">
          회원이 되어 다양한 여행 기록을 남겨보세요!
        </p>

        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label for="userId" class="form-label">아이디</label>
            <input
              type="text"
              class="form-control bg-light"
              id="userId"
              v-model="formData.userId"
              required
            />
          </div>

          <div class="mb-4">
            <label for="userName" class="form-label">이름</label>
            <input
              type="text"
              class="form-control bg-light"
              id="userName"
              v-model="formData.userName"
              required
            />
          </div>

          <div class="mb-4">
            <label for="userPassword" class="form-label">비밀번호</label>
            <input
              type="password"
              class="form-control bg-light"
              id="userPassword"
              v-model="formData.userPassword"
              required
            />
          </div>

          <div class="mb-4">
            <label for="passwordConfirm" class="form-label"
              >비밀번호 재확인</label
            >
            <input
              type="password"
              class="form-control bg-light"
              id="passwordConfirm"
              v-model="formData.passwordConfirm"
              required
            />
          </div>

          <div class="mb-4">
            <label for="birth" class="form-label">생년월일</label>
            <input
              type="text"
              class="form-control bg-light"
              id="birth"
              placeholder="1999-09-09 형식으로 입력해주세요"
              v-model="formData.birth"
              required
            />
          </div>

          <div class="mb-4">
            <label for="gender" class="form-label">성별</label>
            <select
              class="form-select bg-light"
              v-model="formData.gender"
              required
            >
              <option value="">선택하세요</option>
              <option value="1">남성</option>
              <option value="0">여성</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="form-label">이메일</label>
            <div class="input-group">
              <input
                type="text"
                class="form-control bg-light"
                v-model="formData.emailId"
                required
              />
              <span class="input-group-text">@</span>
              <input
                type="text"
                class="form-control bg-light"
                v-model="formData.emailDomain"
                required
              />
            </div>
          </div>

          <button type="submit" class="btn btn-success w-100 py-3 mt-4">
            가입하기
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-control,
.form-select {
  padding: 0.8rem;
  border: none;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.btn-success {
  background-color: #f8d33e;
  border-color: #f8d33e;
}

.btn-success:hover {
  background-color: #f8d33e;
  border-color: #f8d33e;
}

/* 포커스 효과 */
.btn-success:focus {
  background-color: #fff;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  outline: none;
}
</style>
