import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { emailQueue } from "../queue/emailQueue";

export interface ScheduleEmailBatchInput {
  subject: string;
  body: string;
  leads: string[];
  startTime: Date;
  minDelayMs: number;
  hourlyLimitPerSender: number;
  senderKey?: string;
  userId?: string | null;
}

function normalizeLeadEmails(leads: string[]) {
  const emails: string[] = [];
  for (const lead of leads) {
    const normalized = lead.trim().toLowerCase();
    if (normalized.length === 0) continue;
    // Basic email sanity check; full RFC validation isn't required for the assignment.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) continue;
    emails.push(normalized);
  }
  return Array.from(new Set(emails));
}

export async function scheduleEmailBatch(input: ScheduleEmailBatchInput) {
  const normalizedLeads = normalizeLeadEmails(input.leads);

  if (normalizedLeads.length === 0) {
    return { batchId: null as string | null, scheduledCount: 0, leadsCount: 0 };
  }

  const senderKey = input.senderKey ?? env.DEFAULT_SENDER_KEY;
  const startMs = input.startTime.getTime();
  const nowMs = Date.now();

  const batch = await prisma.emailBatch.create({
    data: {
      userId: input.userId ?? null,
      subject: input.subject,
      body: input.body,
      startTime: input.startTime,
      minDelayMs: input.minDelayMs,
      hourlyLimitPerSender: input.hourlyLimitPerSender,
    },
  });

  const scheduledEmails: Array<{ id: string; scheduledTime: Date }> = [];
  for (let i = 0; i < normalizedLeads.length; i++) {
    const recipientEmail = normalizedLeads[i];
    const scheduledTime = new Date(startMs + i * input.minDelayMs);

    const scheduledEmail = await prisma.scheduledEmail.create({
      data: {
        batchId: batch.id,
        recipientEmail,
        senderKey,
        sequence: i,
        scheduledTime,
        status: "pending",
        sentTime: null,
        errorMessage: null,
      },
      select: { id: true, scheduledTime: true },
    });

    scheduledEmails.push(scheduledEmail);
  }

  // Enqueue outside the transaction.
  const jobs = [];
  for (const scheduledEmail of scheduledEmails) {
    const scheduledAtMs = scheduledEmail.scheduledTime.getTime();
    const delayMs = Math.max(0, scheduledAtMs - nowMs);

    jobs.push(
      emailQueue.add(
        "send-email",
        { scheduledEmailId: scheduledEmail.id },
        {
          jobId: `send-email-${scheduledEmail.id}`,
          delay: delayMs,
          removeOnComplete: true,
          attempts: 3,
        },
      ),
    );
  }
  await Promise.all(jobs);

  return {
    batchId: batch.id,
    scheduledCount: scheduledEmails.length,
    leadsCount: normalizedLeads.length,
  };
}

