import { Router } from "express";
import { handleRedirect } from "../controllers/redirectController.js";

const router = Router();

// GET /r/:shortId - Redirect to original URL
router.get("/:shortId", handleRedirect);

export default router;
