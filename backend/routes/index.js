import { Router } from "express";
import authRoutes from "./auth.js";
import shortenRoutes from "./shorten.js";
import redirectRoutes from "./redirect.js";
import adminRoutes from "./admin.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/shorten", shortenRoutes);
router.use("/r", redirectRoutes);
router.use("/admin", adminRoutes);

export default router;
