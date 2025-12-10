import { Router } from "express";
import { ClickLog } from "../models/index.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/admin/export-logs
router.get("/export-logs", requireAdmin, async (req, res, next) => {
  try {
    const { from, to } = req.query;

    // Build date filter
    const filter = {};
    if (from || to) {
      filter.at = {};
      if (from) {
        filter.at.$gte = new Date(from);
      }
      if (to) {
        filter.at.$lte = new Date(to);
      }
    }

    // Set headers for CSV streaming
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="clicklogs_${Date.now()}.csv"`
    );

    // Write CSV header
    res.write("shortId,at,ip,userAgent,referer\n");

    // Stream logs using cursor
    const cursor = ClickLog.find(filter).sort({ at: -1 }).cursor();

    cursor.on("data", (doc) => {
      // Escape CSV fields
      const escape = (val) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const row = [
        escape(doc.shortId),
        escape(doc.at ? doc.at.toISOString() : ""),
        escape(doc.ip),
        escape(doc.userAgent),
        escape(doc.referer),
      ].join(",");

      res.write(row + "\n");
    });

    cursor.on("error", (error) => {
      console.error("Cursor error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error streaming logs" });
      }
    });

    cursor.on("end", () => {
      res.end();
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/stats
router.get("/stats", requireAdmin, async (req, res, next) => {
  try {
    const [totalLinks, totalClicks, totalLogs] = await Promise.all([
      ClickLog.db.collection("shortlinks").countDocuments(),
      ClickLog.db
        .collection("shortlinks")
        .aggregate([{ $group: { _id: null, total: { $sum: "$clicks" } } }])
        .toArray(),
      ClickLog.countDocuments(),
    ]);

    res.json({
      totalLinks,
      totalClicks: totalClicks[0]?.total || 0,
      totalLogs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
