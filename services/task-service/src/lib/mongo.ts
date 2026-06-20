import mongoose from "mongoose";
import { config } from "../config";

// Connect with a small retry loop — Mongo may still be starting when the
// service boots.
export async function connectMongo(retries = 10, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(config.mongoUrl);
      console.log("[task] connected to MongoDB");
      return;
    } catch (err) {
      console.warn(`[task] mongo connection failed (attempt ${attempt}/${retries})`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
