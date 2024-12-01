// file.js
import { authAxios } from "@/util/http-commons";

const axios = authAxios();

async function uploadImage(file, success, fail) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post('/file/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return success(response);
  } catch (error) {
    return fail(error);
  }
}

export {
  uploadImage
};