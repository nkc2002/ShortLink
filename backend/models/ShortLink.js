import mongoose from "mongoose";

const shortLinkSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
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
  },
});

// Note: unique: true in schema already creates index, no need for separate index

const ShortLink = mongoose.model("ShortLink", shortLinkSchema);

export default ShortLink;
