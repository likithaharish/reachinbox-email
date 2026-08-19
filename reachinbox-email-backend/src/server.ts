import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createSessionMiddleware } from "./middleware/session";
import { env } from "./config/env";
import { previewRouter } from "./routes/previews";
import { emailsRouter } from "./routes/emails";
import { authRouter, adminRouter } from "./routes/auth";
import { requireAuth } from "./middleware/requireAuth";
import passport from "passport";
import "./auth/passport";

const isProduction = env.NODE_ENV === "production";

export async function createServer() {
  const app = express();

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use(morgan(isProduction ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use(createSessionMiddleware());

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(previewRouter);

  app.use(authRouter);

  app.get("/api/v1/me", requireAuth, (req, res) => {
    return res.json({
      name: req.user?.name,
      email: req.user?.email,
      avatarUrl: req.user?.avatarUrl,
      isAdmin: Boolean(req.user?.isAdmin),
    });
  });

  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1", requireAuth, emailsRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[server] Unhandled error:", err);
    if (res.headersSent) return;
    res.status(500).json({
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : "Unexpected error",
    });
  });

  return app;
}

async function main() {
  const app = await createServer();

  if (env.START_WORKER_IN_PROCESS) {
    const { startEmailWorkerProcess } = await import("./worker/startWorker");
    await startEmailWorkerProcess();
    // eslint-disable-next-line no-console
    console.log("[server] BullMQ worker started in-process");
  }

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on :${env.PORT}`);
  });
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
