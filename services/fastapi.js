const axios = require("axios");
const { FASTAPI_URL } = require("../config/index");

module.exports = {
  async trainModel(data) {
    const response = await axios.post(`${FASTAPI_URL}/train`, data);
    return response.data;
  },

  async predict(data) {
    const response = await axios.post(`${FASTAPI_URL}/predict`, data);
    return response.data;
  }
};
