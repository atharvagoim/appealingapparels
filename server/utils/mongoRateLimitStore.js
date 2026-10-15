import mongoose from "mongoose";

/**
 * Rate-limit counters kept in MongoDB instead of process memory.
 *
 * The API runs as Vercel serverless functions: every cold start is a fresh
 * process, and many can run side by side, so express-rate-limit's default
 * in-memory store would give each instance its own counter — an attacker's
 * attempts would be spread across them and never hit the limit. Storing the
 * counters in the shared database makes the limits real.
 *
 * One atomic upsert per request; expired counters are removed by a TTL index.
 */
export default class MongoRateLimitStore {
  constructor(prefix) {
    this.prefix = `${prefix}:`;
    // Keys already carry the limiter prefix, so don't let the library add its own.
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  get collection() {
    return mongoose.connection.collection("ratelimits");
  }

  async ensureIndex() {
    if (MongoRateLimitStore.indexed) return;
    MongoRateLimitStore.indexed = true;
    try {
      await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    } catch {
      MongoRateLimitStore.indexed = false;
    }
  }

  async increment(key) {
    this.ensureIndex();
    const now = new Date();
    const fresh = new Date(now.getTime() + this.windowMs);
    const doc = await this.collection.findOneAndUpdate(
      { _id: this.prefix + key },
      [
        {
          $set: {
            // Window still open → count on; otherwise start a new window.
            hits: { $cond: [{ $gt: ["$expiresAt", now] }, { $add: ["$hits", 1] }, 1] },
            expiresAt: { $cond: [{ $gt: ["$expiresAt", now] }, "$expiresAt", fresh] },
          },
        },
      ],
      { upsert: true, returnDocument: "after" }
    );
    return { totalHits: doc.hits, resetTime: doc.expiresAt };
  }

  async decrement(key) {
    await this.collection.updateOne({ _id: this.prefix + key, hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }

  async resetKey(key) {
    await this.collection.deleteOne({ _id: this.prefix + key });
  }
}
