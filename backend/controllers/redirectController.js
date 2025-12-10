import { ShortLink, ClickLog } from "../models/index.js";
import { sendImmediate } from "../services/telegram.js";

// Helper to get client IP
const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
};

// Format Telegram message
const formatTelegramMessage = (
  shortId,
  originalUrl,
  ip,
  userAgent,
  referer
) => {
  const now = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return `🔗 <b>Link Clicked!</b>

📎 <b>Short ID:</b> <code>${shortId}</code>
🌐 <b>Original URL:</b> ${originalUrl.substring(0, 100)}${
    originalUrl.length > 100 ? "..." : ""
  }
📍 <b>IP:</b> <code>${ip}</code>
🕐 <b>Time:</b> ${now}
${referer ? `📤 <b>Referer:</b> ${referer.substring(0, 50)}` : ""}
${userAgent ? `📱 <b>Device:</b> ${parseUserAgent(userAgent)}` : ""}`;
};

// Parse user agent to friendly format
const parseUserAgent = (ua) => {
  if (!ua) return "Unknown";

  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("bot") || ua.includes("Bot")) return "Bot";

  return ua.substring(0, 30) + "...";
};

// GET /:shortId - Redirect handler
export const handleRedirect = async (req, res, next) => {
  try {
    const { shortId } = req.params;

    // Find short link
    const link = await ShortLink.findOne({ shortId });

    if (!link) {
      return res.status(404).json({ message: "Short link not found" });
    }

    // Check if expired
    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(410).json({ message: "Short link has expired" });
    }

    // Get client info
    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;
    const referer = req.headers["referer"] || req.headers["referrer"] || null;

    // Redirect immediately
    res.redirect(302, link.originalUrl);

    // Fire-and-forget background tasks
    Promise.all([
      // Increment click count
      ShortLink.updateOne({ _id: link._id }, { $inc: { clicks: 1 } }),

      // Create click log
      ClickLog.create({
        shortId,
        ip,
        userAgent,
        referer,
        at: new Date(),
      }),

      // Send Telegram notification
      sendImmediate({
        text: formatTelegramMessage(
          shortId,
          link.originalUrl,
          ip,
          userAgent,
          referer
        ),
      }),
    ]).catch((error) => {
      console.error("Background task error:", error.message);
    });
  } catch (error) {
    next(error);
  }
};
