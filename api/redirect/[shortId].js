import axios from "axios";
import connectMongo from "../_lib/mongoose.js";
import ShortLink from "../_lib/models/ShortLink.js";
import ClickLog from "../_lib/models/ClickLog.js";

// Send Telegram message
async function sendTelegram(text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log("[Telegram] Not configured - missing BOT_TOKEN or CHAT_ID");
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      },
      { timeout: 5000 }
    );
    console.log("[Telegram] Message sent successfully");
  } catch (error) {
    console.error("[Telegram] Error:", error.message);
  }
}

// Get client IP
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

// Parse user agent
function parseUserAgent(ua) {
  if (!ua) return "Unknown";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "Mac";
  return "Browser";
}

// Handler
export default async function handler(req, res) {
  const { shortId } = req.query;

  if (!shortId) {
    return res.status(400).json({ message: "Short ID required" });
  }

  try {
    await connectMongo();

    // Use lean() for faster read-only query
    const link = await ShortLink.findOne({ shortId }).lean();

    if (!link) {
      return res.status(404).json({ message: "Short link not found" });
    }

    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";
    const referer = req.headers["referer"] || "";
    const now = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Run all tasks in parallel BEFORE redirecting
    // This ensures Telegram message is sent before function terminates
    await Promise.all([
      ShortLink.updateOne({ _id: link._id }, { $inc: { clicks: 1 } }),
      ClickLog.create({ shortId, ip, userAgent, referer }),
      sendTelegram(
        `🔗 <b>Link Clicked!</b>\n\n` +
          `📎 <b>Short ID:</b> <code>${shortId}</code>\n` +
          `🌐 <b>URL:</b> ${link.originalUrl.substring(0, 80)}${
            link.originalUrl.length > 80 ? "..." : ""
          }\n` +
          `📍 <b>IP:</b> <code>${ip}</code>\n` +
          `📱 <b>Device:</b> ${parseUserAgent(userAgent)}\n` +
          `🕐 <b>Time:</b> ${now}`
      ),
    ]);

    // Redirect after all background tasks complete
    return res.redirect(302, link.originalUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
