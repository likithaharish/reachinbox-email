import Redis, { type RedisOptions } from "ioredis";
import { env } from "../config/env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

/**
 * Free-tier note (Upstash Redis: 500k commands/month):
 * BullMQ workers poll Redis even when the queue is empty. Keep app traffic on a
 * separate connection that fails fast (no retry storms) if the quota is exhausted.
 * BullMQ still needs maxRetriesPerRequest=null and its own clients.
 *
 * Login/session is NOT stored here — Google OAuth uses MemoryStore.
 */
function redisOptions(kind: "bullmq" | "app"): RedisOptions {
  const useTls = env.REDIS_HOST !== "localhost" && env.REDIS_HOST !== "127.0.0.1";

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    username: env.REDIS_PASSWORD ? "default" : undefined,
    tls: useTls ? {} : undefined,
    enableReadyCheck: false,
    family: 4,
    maxRetriesPerRequest: kind === "bullmq" ? null : 3,
    enableOfflineQueue: kind === "bullmq",
  };
}

/** Dedicated connection — BullMQ Queue and Worker must not share one Redis client. */
export function createRedisConnection(): Redis {
  return new Redis(redisOptions("bullmq"));
}

/** Shared connection for locks and rate-limit Lua. */
export function getRedisConnection(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;
  globalForRedis.redis = new Redis(redisOptions("app"));
  return globalForRedis.redis;
}
