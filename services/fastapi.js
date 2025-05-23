const axios = require("axios");
const { FASTAPI_URL } = require("../config/index");

exports.predict = async (payload) => {
  console.log("Sending payload to FastAPI:", payload); // اضافه کن برای دیباگ
  try {
    const response = await axios.post(`${FASTAPI_URL}/predict`, payload);
    console.log("Received from FastAPI:", response.data); // جواب API رو لاگ کن
    return response.data;
  } catch (error) {
    console.error("Error calling FastAPI:", error.message || error);
    throw error; // خطا رو دوباره بنداز بیرون که تو tryCatch بالاتر بگیری
  }
};
