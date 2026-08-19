import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import passport from "passport";
import { env } from "../config/env";
import { requireAdmin } from "../middleware/requireAdmin";
import { clearSessionCookie } from "../middleware/session";
import { prisma } from "../db/prisma";
import { deleteAllEmailData } from "../services/emailCleanup";
import { consumeAuthTicket, createAuthTicket } from "../services/authTicket";

export const authRouter = Router();

const frontendOrigin = () => env.FRONTEND_URL.replace(/\/$/, "");

authRouter.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

authRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${env.FRONTEND_URL}` }),
  (req: Request, res: Response) => {
    if (!req.user) {
      return res.redirect(`${frontendOrigin()}/`);
    }

    const ticket = createAuthTicket(req.user);
    return res.redirect(`${frontendOrigin()}/#/auth/callback?ticket=${encodeURIComponent(ticket)}`);
  },
);

const GoogleSessionSchema = z.object({
  ticket: z.string().min(1),
});

authRouter.post("/api/v1/sessions", (req: Request, res: Response) => {
  const parsed = GoogleSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      message: "A login ticket is required",
    });
  }

  const user = consumeAuthTicket(parsed.data.ticket);
  if (!user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Login ticket is invalid or expired. Please sign in with Google again.",
    });
  }

  req.login(user, (err) => {
    if (err) {
      console.error("[auth] Failed to create Google session:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to create session",
      });
    }

    return res.status(201).json({
      data: {
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        isAdmin: Boolean(user.isAdmin),
      },
    });
  });
});

function finishLogout(req: Request, res: Response) {
  const redirectToLogin = () => {
    clearSessionCookie(res);
    if (req.headers.accept?.includes("application/json") || req.method === "POST") {
      return res.json({ success: true });
    }
    return res.redirect(`${env.FRONTEND_URL}/`);
  };

  if (!req.session) {
    return redirectToLogin();
  }

  req.session.destroy((err) => {
    if (err) {
      console.error("[auth] Failed to destroy session:", err);
    }
    redirectToLogin();
  });
}

function handleLogout(req: Request, res: Response) {
  if (typeof req.logout !== "function") {
    return finishLogout(req, res);
  }

  req.logout((err) => {
    if (err) {
      console.error("[auth] Passport logout failed:", err);
    }
    finishLogout(req, res);
  });
}

authRouter.get("/auth/logout", handleLogout);
authRouter.post("/auth/logout", handleLogout);

const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function secretsMatch(provided: string, expected: string) {
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

authRouter.post("/api/v1/admin/sessions", (req: Request, res: Response) => {
  const parsed = AdminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      message: "Email and password are required",
    });
  }

  const emailOk = secretsMatch(parsed.data.email.trim().toLowerCase(), env.ADMIN_EMAIL.toLowerCase());
  const passwordOk = secretsMatch(parsed.data.password, env.ADMIN_PASSWORD);

  if (!emailOk || !passwordOk) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid admin credentials" });
  }

  const adminUser: Express.User = {
    id: "admin",
    googleSub: "admin-local",
    email: env.ADMIN_EMAIL,
    name: "Administrator",
    isAdmin: true,
  };

  req.login(adminUser, (err) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error", message: "Failed to create admin session" });
    }

    return res.status(201).json({
      data: {
        name: adminUser.name,
        email: adminUser.email,
        isAdmin: true,
      },
    });
  });
});

const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().optional(),
});

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/metrics", async (_req, res) => {
  const [userCount, batchCount, pendingCount, sentCount, failedCount] = await Promise.all([
    prisma.googleUser.count(),
    prisma.emailBatch.count(),
    prisma.scheduledEmail.count({ where: { status: "pending" } }),
    prisma.scheduledEmail.count({ where: { status: "sent" } }),
    prisma.scheduledEmail.count({ where: { status: "failed" } }),
  ]);

  return res.json({
    data: {
      userCount,
      batchCount,
      pendingCount,
      sentCount,
      failedCount,
    },
  });
});

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.googleUser.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { batches: true } },
    },
  });

  const emails = await prisma.scheduledEmail.findMany({
    select: {
      status: true,
      batch: { select: { userId: true } },
    },
  });

  const statsByUser = new Map<string, { pending: number; sent: number; failed: number }>();
  for (const row of emails) {
    const userId = row.batch.userId;
    if (!userId) continue;
    const current = statsByUser.get(userId) ?? { pending: 0, sent: 0, failed: 0 };
    if (row.status === "pending") current.pending += 1;
    if (row.status === "sent") current.sent += 1;
    if (row.status === "failed") current.failed += 1;
    statsByUser.set(userId, current);
  }

  return res.json({
    data: users.map((user) => {
      const stats = statsByUser.get(user.id) ?? { pending: 0, sent: 0, failed: 0 };
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        batchCount: user._count.batches,
        pendingCount: stats.pending,
        sentCount: stats.sent,
        failedCount: stats.failed,
      };
    }),
  });
});

adminRouter.get("/emails", async (req, res) => {
  const parsed = PaginationQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation error", message: "Invalid query" });
  }

  const { page, pageSize, userId } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = userId ? { batch: { userId } } : {};

  const [rows, totalCount] = await prisma.$transaction([
    prisma.scheduledEmail.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        recipientEmail: true,
        scheduledTime: true,
        sentTime: true,
        status: true,
        errorMessage: true,
        previewToken: true,
        batch: {
          select: {
            subject: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.scheduledEmail.count({ where }),
  ]);

  return res.json({
    data: rows.map((row) => ({
      id: row.id,
      email: row.recipientEmail,
      subject: row.batch.subject,
      scheduledTime: row.scheduledTime.toISOString(),
      sentTime: row.sentTime ? row.sentTime.toISOString() : null,
      status: row.status,
      errorMessage: row.errorMessage,
      previewToken: row.previewToken,
      user: row.batch.user
        ? {
            id: row.batch.user.id,
            name: row.batch.user.name,
            email: row.batch.user.email,
          }
        : null,
    })),
    totalCount,
    page,
    pageSize,
  });
});

adminRouter.delete("/emails", async (_req, res) => {
  try {
    const result = await deleteAllEmailData();
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[admin] Failed to delete emails:", {
      error: error instanceof Error ? error.message : error,
    });
    return res.status(500).json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Failed to delete emails",
    });
  }
});
