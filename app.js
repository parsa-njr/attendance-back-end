const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 8080;

const authRoute = require("./routes/Auth/authRoute");
const aiRoute = require("./routes/aiRoute");
const userRoute = require("./routes/Customer/userRoute");
const customerProfileRoute = require("./routes/Customer/profileRoute");
const userRequestRoute = require("./routes/User/requestsRoute");
const customerRequestRoute = require("./routes/Customer/requestRoute");
const locationRoute = require("./routes/Customer/locationRoute");
const userAttendanceRoute = require("./routes/User/attendanceRoute");
const shiftRoute = require("./routes/Customer/shiftRoute");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./db/connect");
const cors = require("cors");

require("dotenv").config();
require("express-async-errors");

// Allow requests from any origin (for dev, use tighter config in prod)
const corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static profile images
app.use(
  "/uploads/profile-images",
  express.static(path.join(__dirname, "images/profile-images"))
);

app.use(
  "/api/v1",
  aiRoute,
  userRoute,
  userAttendanceRoute,
  customerProfileRoute,
  locationRoute,
  userRequestRoute,
  customerRequestRoute,
  shiftRoute

);

app.use("/api/v1/auth", authRoute);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server and listen on all network interfaces
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server is listening on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

start();
