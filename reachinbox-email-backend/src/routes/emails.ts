import { Router } from "express";
import { z } from "zod";
import { scheduleEmailBatch } from "../services/emailScheduler";
import { prisma } from "../db/prisma";

const ScheduleEmailBatchRequestSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  leads: z.array(z.string().min(1)).min(1),
  startTime: z.string().min(1),
  minDelaySeconds: z.coerce.number().int().min(0).default(0),
  hourlyLimitPerSender: z.coerce.number().int().min(0).default(200),
});

export const emailsRouter = Router();

emailsRouter.post("/email-batches", async (req, res) => {
  try {
    const parsed = ScheduleEmailBatchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation error",
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { subject, body, leads, startTime, minDelaySeconds, hourlyLimitPerSender } = parsed.data;
    const startDate = new Date(startTime);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({
        error: "Validation error",
        message: "Invalid start time",
      });
    }

    const result = await scheduleEmailBatch({
      subject,
      body,
      leads,
      startTime: startDate,
      minDelayMs: minDelaySeconds * 1000,
      hourlyLimitPerSender,
      userId: req.user?.isAdmin ? null : req.user?.id,
    });

    return res.status(201).json({ data: result });
  } catch (error) {
    console.error("[email-batches] Failed to schedule:", {
      error: error instanceof Error ? error.message : error,
      userId: req.user?.id,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Failed to schedule emails",
    });
  }
});

const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

emailsRouter.get("/emails/scheduled", async (req, res) => {
  const parsed = PaginationQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error", message: "Invalid pagination query" });
  }

  const { page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;
  const userFilter = req.user?.isAdmin ? {} : { batch: { userId: req.user?.id ?? "__none__" } };

  const [rows, totalCount] = await prisma.$transaction([
    prisma.scheduledEmail.findMany({
      where: { status: "pending", ...userFilter },
      orderBy: { scheduledTime: "asc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        recipientEmail: true,
        senderKey: true,
        scheduledTime: true,
        status: true,
        batch: {
          select: {
            subject: true,
          },
        },
      },
    }),
    prisma.scheduledEmail.count({ where: { status: "pending", ...userFilter } }),
  ]);

  type ScheduledRow = {
    id: string;
    recipientEmail: string;
    scheduledTime: Date;
    status: "pending";
    batch: { subject: string };
  };

  const scheduledRows = rows as ScheduledRow[];

  return res.json({
    data: scheduledRows.map((r) => ({
      id: r.id,
      email: r.recipientEmail,
      subject: r.batch.subject,
      scheduledTime: r.scheduledTime.toISOString(),
      status: r.status,
    })),
    totalCount,
    page,
    pageSize,
  });
});

emailsRouter.get("/emails/sent", async (req, res) => {
  const parsed = PaginationQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error", message: "Invalid pagination query" });
  }

  const { page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;
  const userFilter = req.user?.isAdmin ? {} : { batch: { userId: req.user?.id ?? "__none__" } };

  const [rows, totalCount] = await prisma.$transaction([
    prisma.scheduledEmail.findMany({
      where: { status: { in: ["sent", "failed"] }, ...userFilter },
      orderBy: { sentTime: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        recipientEmail: true,
        scheduledTime: true,
        sentTime: true,
        status: true,
        previewToken: true,
        batch: {
          select: {
            subject: true,
          },
        },
      },
    }),
    prisma.scheduledEmail.count({ where: { status: { in: ["sent", "failed"] }, ...userFilter } }),
  ]);

  type SentRow = {
    id: string;
    recipientEmail: string;
    scheduledTime: Date;
    sentTime: Date | null;
    status: "sent" | "failed";
    previewToken: string | null;
    batch: { subject: string };
  };

  const sentRows = rows as SentRow[];

  return res.json({
    data: sentRows.map((r) => ({
      id: r.id,
      email: r.recipientEmail,
      subject: r.batch.subject,
      sentTime: r.sentTime ? r.sentTime.toISOString() : null,
      status: r.status,
      previewToken: r.previewToken,
    })),
    totalCount,
    page,
    pageSize,
  });
});

