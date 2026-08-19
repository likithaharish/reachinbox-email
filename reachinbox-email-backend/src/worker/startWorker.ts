import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { emailQueue } from "../queue/emailQueue";
import { startEmailWorker } from "./emailWorker";

async function recoverDuePendingEmails() {
  const due = await prisma.scheduledEmail.findMany({
    where: {
      status: "pending",
      scheduledTime: { lte: new Date() },
    },
    select: { id: true },
    take: 200,
    orderBy: { scheduledTime: "asc" },
  });

  let enqueued = 0;
  for (const email of due) {
    try {
      await emailQueue.add(
        "send-email",
        { scheduledEmailId: email.id },
        {
          jobId: `send-email-${email.id}`,
          delay: 0,
        },
      );
      enqueued += 1;
    } catch {
      // Job already queued — skip extra Redis GETs.
    }
  }

  console.log("[worker] recovered due pending emails", { due: due.length, enqueued });
}

export async function startEmailWorkerProcess() {
  startEmailWorker();
  await recoverDuePendingEmails();
  console.log("[worker] started", { queue: env.BULLMQ_QUEUE_NAME });
}

