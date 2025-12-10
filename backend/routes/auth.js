import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me (requires auth)
router.get("/me", requireAuth, getMe);

// POST /api/auth/logout
router.post("/logout", logout);

export default router;
