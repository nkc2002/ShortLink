import { Router } from "express";
import rateLimit from "express-rate-limit";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import {
  createShortLink,
  getHistory,
  getStats,
  deleteShortLink,
} from "../controllers/shortenController.js";

const router = Router();

// Rate limiter: 30 requests per day per IP
const shortenLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 30,
  message: {
    message: "Too many requests. Limit is 30 shortened URLs per day.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers["x-forwarded-for"] || "unknown";
  },
});

// POST /api/shorten (optional auth for owner assignment)
router.post("/", shortenLimiter, optionalAuth, createShortLink);

// GET /api/shorten/history (requires auth)
router.get("/history", requireAuth, getHistory);

// GET /api/shorten/:shortId/stats (public)
router.get("/:shortId/stats", getStats);

// DELETE /api/shorten/:shortId (requires auth)
router.delete("/:shortId", requireAuth, deleteShortLink);

export default router;
