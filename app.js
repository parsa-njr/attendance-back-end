const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 8080;
// const authRoute = require("./routes/Auth/AuthRoute");
const categoryRoute = require("./routes/categoryRoute");
const authRoute = require("./routes/Auth/authRoute");
const predictRoute = require("./routes/predictRoute");
const userRoute = require("./routes/Customer/userRoute");
const customerProfileRoute = require("./routes/Customer/profileRoute");
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

app.use(
  "/uploads/profile-images",
  express.static(path.join(__dirname, "images/profileImages"))
);

// route
app.use(
  "/api/v1",
  categoryRoute,
  predictRoute,
  userRoute,
  customerProfileRoute
);
app.use("/api/v1/auth", authRoute);

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
