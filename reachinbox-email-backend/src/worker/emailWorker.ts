import { DelayedError, Job, Worker } from "bullmq";
import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { getRedisConnection, createRedisConnection } from "../queue/connection";
import type { SendEmailJobData } from "../queue/emailQueue";
import type { SendEmailResult } from "../services/emailSender";
import { sendEmail } from "../services/emailSender";
import { createPreviewToken } from "../services/emailPreview";
import { tryConsumeHourlyLimit } from "../services/hourlyLimiter";
import { waitForMinDelay } from "../services/minDelayThrottle";

async function acquireProcessingLock(params: {
  redisKey: string;
  token: string;
  ttlMs: number;
}): Promise<boolean> {
  try {
    const redis = getRedisConnection();
    const result = (await (redis as any).set(
      params.redisKey,
      params.token,
      "NX",
      "PX",
      params.ttlMs,
    )) as string;
    return result === "OK";
  } catch (error) {
    console.warn("[emailWorker] Redis lock unavailable; continuing send", {
      error: error instanceof Error ? error.message : error,
    });
    return true;
  }
}

async function releaseProcessingLock(params: { redisKey: string; token: string }) {
  try {
    const redis = getRedisConnection();
    await redis.del(params.redisKey);
  } catch {
    // Ignore lock-release failures so a Redis quota error cannot fail a sent email.
  }
}

function getLockToken(job: Job<SendEmailJobData>) {
  // token isn't guaranteed to be stable across all versions; we still use it if provided by bullmq.
  return String(job.id ?? job.name ?? "unknown-job");
}

async function markEmailSent(scheduledEmailId: string, sent: SendEmailResult) {
  // Free-tier note: preview JSON can fail (migration lag, payload size, Redis/DB
  // hiccups). Test batches of ~10 emails must still move to `sent`; skip preview.
  const sentTime = new Date();

  if (sent.preview) {
    try {
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: {
          status: "sent",
          sentTime,
          errorMessage: null,
          messageId: sent.messageId,
          previewToken: createPreviewToken(),
          previewPayload: sent.preview as unknown as Prisma.InputJsonValue,
        },
      });
      return;
    } catch (error) {
      console.warn("[emailWorker] Preview save failed; marking sent without preview", {
        scheduledEmailId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  try {
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: {
        status: "sent",
        sentTime,
        errorMessage: null,
        messageId: sent.messageId,
      },
    });
  } catch (error) {
    console.warn("[emailWorker] messageId save failed; marking sent with status only", {
      scheduledEmailId,
      error: error instanceof Error ? error.message : error,
    });
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: {
        status: "sent",
        sentTime,
        errorMessage: null,
      },
    });
  }
}

async function processSendEmail(job: Job<SendEmailJobData>, token?: string) {
  const scheduledEmailId = job.data.scheduledEmailId;

  const scheduledEmail = await prisma.scheduledEmail.findUnique({
    where: { id: scheduledEmailId },
    include: { batch: true },
  });

  // Idempotency: job might exist but row already processed (or deleted).
  if (!scheduledEmail || scheduledEmail.status !== "pending") return;

  const redisToken = token ?? getLockToken(job);
  const redisKey = `locks:reachinbox:send-email:${scheduledEmailId}`;

  const lockAcquired = await acquireProcessingLock({
    redisKey,
    token: redisToken,
    ttlMs: 10 * 60 * 1000, // 10 minutes
  });

  if (!lockAcquired) {
    // Someone else is already processing this job.
    return;
  }

  try {
    const nowMs = Date.now();

    // Enforce hourly limit + delay between emails (stubs for now).
    // These will be replaced with Redis-backed implementations in later steps.
    const limiterResult = await tryConsumeHourlyLimit({
      senderKey: scheduledEmail.senderKey,
      nowMs,
      limitPerHour: scheduledEmail.batch.hourlyLimitPerSender,
    });
    if (!limiterResult.allowed && limiterResult.nextAllowedAtMs) {
      // Move job back to the next available hour window without counting it as a failure.
      await job.moveToDelayed(limiterResult.nextAllowedAtMs, token);
      throw new DelayedError();
    }

    await waitForMinDelay(scheduledEmail.senderKey, scheduledEmail.batch.minDelayMs);

    const sent = await sendEmail({
      to: scheduledEmail.recipientEmail,
      subject: scheduledEmail.batch.subject,
      htmlBody: scheduledEmail.batch.body,
      senderKey: scheduledEmail.senderKey,
    });

    await markEmailSent(scheduledEmail.id, sent);
  } catch (error) {
    if (error instanceof DelayedError) {
      // This is an intentional control-flow mechanism (move back to delayed state).
      // The job should remain pending, so we don't update it to failed.
      throw error;
    }

    await prisma.scheduledEmail.update({
      where: { id: scheduledEmail.id },
      data: {
        status: "failed",
        sentTime: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  } finally {
    await releaseProcessingLock({ redisKey, token: redisToken });
  }
}

export function startEmailWorker() {
  const worker = new Worker<SendEmailJobData>(
    env.BULLMQ_QUEUE_NAME,
    async (job, token) => {
      await processSendEmail(job, token);
    },
    {
      connection: createRedisConnection(),
      concurrency: env.BULLMQ_WORKER_CONCURRENCY,
      lockDuration: 300_000,
      // Free-tier note (Upstash 500k cmds/month): default BullMQ polling can
      // exhaust the quota while idle. Poll slowly and skip stalled checks;
      // this deploy runs a single in-process worker on Render free.
      skipStalledCheck: true,
      drainDelay: 30,
    },
  );

  worker.on("completed", (job) => {
    console.log("[emailWorker] completed", { jobId: job.id, scheduledEmailId: job.data.scheduledEmailId });
  });

  worker.on("failed", (job, err) => {
    console.error("[emailWorker] failed", { jobId: job?.id, err: err.message });
  });

  return worker;
}

