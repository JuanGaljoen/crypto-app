// import Redis from "ioredis";

// export const redisClient = new Redis({
//     host: "127.0.0.1",
//     port: 6379
// });

// redisClient.on("connect", () => console.log("Connected to Redis"));
// redisClient.on("error", (err) => console.error("Redis Error:", err));
// cache.ts
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Create Redis client
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redisClient.on("connect", () => {
    console.log("Connected to Redis");
});

redisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
});

export { redisClient };