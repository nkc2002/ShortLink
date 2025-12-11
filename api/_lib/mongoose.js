import mongoose from "mongoose";

const MONGODB_OPTIONS = {
  minPoolSize: 1,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  bufferCommands: false, // Disable mongoose buffering
  maxIdleTimeMS: 10000, // Close idle connections after 10s
};

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectMongo() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined");
  }

  // Return existing connection if available
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  // Create new connection if no promise exists
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, MONGODB_OPTIONS).then((mongoose) => {
      console.log("[MongoDB] Connected successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}

export default connectMongo;
