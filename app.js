const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
// const authRoute = require("./routes/Auth/AuthRoute");
const categoryRoute = require("./routes/categoryRoute");
const predictRoute = require("./routes/predictRoute");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./db/connect");
const cors = require("cors");
require("dotenv").config();
require("express-async-errors");

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOptions));
// middleweare
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// route
app.use("/api/v1", categoryRoute, predictRoute);

// app.use("/api/v1/Auth", authRoute);
app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
