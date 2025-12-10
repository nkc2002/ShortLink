import mongoose from "mongoose";

const ttlDays = parseInt(process.env.CLICKLOG_TTL_DAYS, 10) || 90;
const ttlSeconds = ttlDays * 24 * 60 * 60;

const clickLogSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    trim: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
  ip: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  referer: {
    type: String,
    default: null,
  },
});

clickLogSchema.index({ shortId: 1, at: -1 });
clickLogSchema.index({ at: 1 }, { expireAfterSeconds: ttlSeconds });

export default mongoose.models.ClickLog ||
  mongoose.model("ClickLog", clickLogSchema);
