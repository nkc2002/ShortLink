import axios from "axios";

/**
 * Send message immediately via Telegram API
 */
export async function sendImmediate({ text, chatId }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken) {
    console.log("[Telegram] TELEGRAM_BOT_TOKEN not configured, skipping");
    return null;
  }

  if (!targetChatId) {
    console.log("[Telegram] TELEGRAM_CHAT_ID not configured, skipping");
    return null;
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      },
      {
        timeout: 10000,
      }
    );

    console.log("[Telegram] Message sent successfully");
    return response.data;
  } catch (error) {
    console.error(
      "[Telegram] Error:",
      error.response?.data?.description || error.message
    );
    return null;
  }
}

export default { sendImmediate };
