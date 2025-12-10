import mongoose from "mongoose";

export default async function handler(req, res) {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      return res.status(500).json({ error: "MONGO_URI not defined" });
    }

    // Connect
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri, { maxPoolSize: 5 });
    }

    // Simple test
    const dbName = mongoose.connection.db.databaseName;

    return res.status(200).json({
      message: "MongoDB connected!",
      database: dbName,
      status: mongoose.connection.readyState,
    });
  } catch (error) {
    console.error("MongoDB error:", error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack?.substring(0, 500),
    });
  }
}
