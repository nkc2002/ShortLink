import mongoose from "mongoose";

// TTL in seconds: default 90 days, configurable via CLICKLOG_TTL_DAYS env
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

// Compound index for shortId + at queries
clickLogSchema.index({ shortId: 1, at: -1 });

// TTL index for automatic expiration
clickLogSchema.index({ at: 1 }, { expireAfterSeconds: ttlSeconds });

const ClickLog = mongoose.model("ClickLog", clickLogSchema);

export default ClickLog;
