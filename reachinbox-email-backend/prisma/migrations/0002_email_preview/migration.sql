-- AlterTable
ALTER TABLE "ScheduledEmail" ADD COLUMN "messageId" TEXT;
ALTER TABLE "ScheduledEmail" ADD COLUMN "previewToken" TEXT;
ALTER TABLE "ScheduledEmail" ADD COLUMN "previewPayload" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledEmail_previewToken_key" ON "ScheduledEmail"("previewToken");
