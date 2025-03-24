import { redisClient } from "../src/cache";
import { test, expect } from '@jest/globals';

test("should cache token data in Redis", async () => {
    await redisClient.set("test_key", "test_value");

    const value = await redisClient.get("test_key");
    expect(value).toBe("test_value");
});
