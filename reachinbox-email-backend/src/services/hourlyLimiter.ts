import { getRedisConnection } from "../queue/connection";

const HOUR_MS = 60 * 60 * 1000;

async function evalHourlyLimiter(params: {
  senderKey: string;
  nowMs: number;
  limitPerHour: number;
}): Promise<{ allowed: boolean; nextAllowedAtMs: number }> {
  const { senderKey, nowMs, limitPerHour } = params;

  const hourWindowStartMs = Math.floor(nowMs / HOUR_MS) * HOUR_MS;
  const nextHourWindowStartMs = hourWindowStartMs + HOUR_MS;
  const ttlSeconds = Math.max(1, Math.ceil((nextHourWindowStartMs - nowMs) / 1000));

  const redisKey = `rate:reachinbox:hourly:${senderKey}:${hourWindowStartMs}`;

  // Atomic counter with a conditional increment:
  // - if current < limit => increment and allow
  // - else => deny and return next hour start timestamp
  const lua = `
    local currentVal = redis.call('get', KEYS[1])
    if currentVal == false then
      currentVal = 0
    else
      currentVal = tonumber(currentVal)
    end

    local limit = tonumber(ARGV[1])
    local expireSeconds = tonumber(ARGV[2])
    local nextAllowedAtMs = tonumber(ARGV[3])

    if currentVal < limit then
      local newVal = redis.call('incr', KEYS[1])
      if newVal == 1 then
        redis.call('expire', KEYS[1], expireSeconds)
      end
      return {1, 0, nextAllowedAtMs}
    end

    return {0, 0, nextAllowedAtMs}
  `;

  const redis = getRedisConnection();
  const result = (await redis.eval(lua, 1, redisKey, String(limitPerHour), String(ttlSeconds), String(nextHourWindowStartMs))) as
    | number[]
    | null;

  // result[1] = allowed flag (1/0). result[3] is nextAllowedAtMs.
  const allowed = Array.isArray(result) && result[0] === 1;
  return { allowed, nextAllowedAtMs: nextHourWindowStartMs };
}

export async function tryConsumeHourlyLimit(params: {
  senderKey: string;
  nowMs: number;
  limitPerHour: number;
}): Promise<{ allowed: boolean; nextAllowedAtMs?: number }> {
  if (params.limitPerHour <= 0) {
    return { allowed: true };
  }

  try {
    const { allowed, nextAllowedAtMs } = await evalHourlyLimiter(params);
    return allowed ? { allowed: true } : { allowed: false, nextAllowedAtMs };
  } catch (error) {
    // Upstash free quota / Redis outage: do not fail the email job.
    console.warn("[hourlyLimiter] Redis unavailable; allowing send", {
      error: error instanceof Error ? error.message : error,
    });
    return { allowed: true };
  }
}

