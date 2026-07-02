import mongoose from "mongoose";
import config from "./env.js";

mongoose.set("strictQuery", true);

export async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error("✖ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
