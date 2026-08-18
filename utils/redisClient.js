const { createClient } = require("redis");

async function createRedisClient() {
    const client = createClient({
        url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    });

    client.on("connect", () => console.info("Redis client connected"));

    client.on("error", (err) => console.error("Redis Client Error", err));

    await client.connect();

    return client;
}

module.exports = createRedisClient;