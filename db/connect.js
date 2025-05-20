const mongoose = require("mongoose");

const connectToDb = (url) => {
  return mongoose
    .connect(url)
    .then(() => {
      console.log("Connected to the database");
    })
    .catch((error) => {
      console.error("Error connecting to the database:", error);
      throw error;
    });
};

module.exports = connectToDb;
