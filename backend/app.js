import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectMongo } from "./lib/mongoose.js";
import routes from "./routes/index.js";
import { handleRedirect } from "./controllers/redirectController.js";

const app = express();

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  connectMongo(mongoUri).catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
}

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use("/api", routes);

// Short URL redirect (GET /r/:shortId)
app.get("/r/:shortId", handleRedirect);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

export default app;
