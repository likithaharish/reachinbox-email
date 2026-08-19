import { prisma } from "../db/prisma";
import { emailQueue } from "../queue/emailQueue";

/**
 * Admin "delete all emails" must wipe Postgres, not only Redis/BullMQ.
 * TRUNCATE is used so leftover campaign + scheduled rows cannot reappear
 * after a queue obliterate on the free Render/Upstash deploy.
 */
export async function deleteAllEmailData() {
  const deletedEmails = await prisma.scheduledEmail.count();
  const deletedBatches = await prisma.emailBatch.count();

  try {
    await emailQueue.obliterate({ force: true });
  } catch (error) {
    console.error("[admin] Failed to clear email queue:", {
      error: error instanceof Error ? error.message : error,
    });
  }

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "ScheduledEmail", "EmailBatch" CASCADE`);
  } catch (error) {
    console.warn("[admin] TRUNCATE failed, falling back to deleteMany:", {
      error: error instanceof Error ? error.message : error,
    });
    await prisma.$transaction([
      prisma.scheduledEmail.deleteMany(),
      prisma.emailBatch.deleteMany(),
    ]);
  }

  const remainingEmails = await prisma.scheduledEmail.count();
  const remainingBatches = await prisma.emailBatch.count();
  if (remainingEmails > 0 || remainingBatches > 0) {
    throw new Error("Email records were not removed from the database");
  }

  return { deletedEmails, deletedBatches };
}
