import { getRedisConnection } from "../queue/connection";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function reserveMinDelaySlot(params: {
  senderKey: string;
  nowMs: number;
  minDelayMs: number;
}): Promise<{ waitMs: number }> {
  const { senderKey, nowMs, minDelayMs } = params;

  const throttleKey = `throttle:reachinbox:minDelay:${senderKey}`;

  // nextAllowedAtMs reservation algorithm:
  // - If nextAllowedAtMs <= now => allow immediately, reserve now+minDelay
  // - Else => wait until nextAllowedAtMs, then reserve nextAllowedAtMs+minDelay
  const lua = `
    local throttleKey = KEYS[1]
    local nowMs = tonumber(ARGV[1])
    local minDelayMs = tonumber(ARGV[2])

    local currentNextAllowedAt = redis.call('get', throttleKey)
    if currentNextAllowedAt == false then
      currentNextAllowedAt = 0
    else
      currentNextAllowedAt = tonumber(currentNextAllowedAt)
    end

    local waitMs = 0
    local nextAllowedAt = 0

    if currentNextAllowedAt <= nowMs then
      nextAllowedAt = nowMs + minDelayMs
      waitMs = 0
    else
      waitMs = currentNextAllowedAt - nowMs
      nextAllowedAt = currentNextAllowedAt + minDelayMs
    end

    redis.call('set', throttleKey, tostring(nextAllowedAt))

    -- Expire slightly after the reserved next slot to prevent unbounded key growth.
    local ttlSeconds = math.max(1, math.ceil((nextAllowedAt - nowMs) / 1000) + 60)
    redis.call('expire', throttleKey, ttlSeconds)

    return {waitMs}
  `;

  const redis = getRedisConnection();
  const result = (await redis.eval(lua, 1, throttleKey, String(nowMs), String(minDelayMs))) as number[] | null;

  const waitMs = Array.isArray(result) ? Number(result[0] ?? 0) : 0;
  return { waitMs };
}

export async function waitForMinDelay(senderKey: string, minDelayMs: number) {
  if (!senderKey) return;
  if (minDelayMs <= 0) return;

  try {
    const nowMs = Date.now();
    const { waitMs } = await reserveMinDelaySlot({ senderKey, nowMs, minDelayMs });
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  } catch (error) {
    // Upstash free quota: keep the min delay in-process instead of failing the job.
    console.warn("[minDelay] Redis unavailable; using local delay", {
      error: error instanceof Error ? error.message : error,
    });
    await sleep(minDelayMs);
  }
}

