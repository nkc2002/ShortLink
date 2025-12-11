import mongoose from "mongoose";

const shortLinkSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true, // Index for fast lookups
  },
  originalUrl: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true, // Index for fast user queries
  },
  clicks: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting by date
  },
});

// Compound index for common query pattern
shortLinkSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.models.ShortLink ||
  mongoose.model("ShortLink", shortLinkSchema);
