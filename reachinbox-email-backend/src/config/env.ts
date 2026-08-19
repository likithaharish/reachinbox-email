import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().optional().default("development"),
  PORT: z.coerce.number().int().default(5177),

  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  DATABASE_URL: z.string(),

  BULLMQ_QUEUE_NAME: z.string().default("reachinbox-email-scheduler"),
  BULLMQ_WORKER_CONCURRENCY: z.coerce.number().int().min(1).default(3),

  // OAuth (Google)
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().min(1),

  SESSION_SECRET: z.string().min(1),

  // Ethereal SMTP
  ETHEREAL_SMTP_HOST: z.string().min(1),
  ETHEREAL_SMTP_PORT: z.coerce.number().int().default(587),
  ETHEREAL_SMTP_USER: z.string().min(1),
  ETHEREAL_SMTP_PASS: z.string().min(1),
  ETHEREAL_SMTP_FROM_EMAIL: z.string().min(1),

  // Identifier used for rate limiting / sender group.
  DEFAULT_SENDER_KEY: z.string().default("default"),

  FRONTEND_URL: z.string().default("http://localhost:5178"),

  // When true, starts the BullMQ worker in the same process as the API server.
  START_WORKER_IN_PROCESS: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),

  // Admin dashboard login (email + password, separate from Google users)
  ADMIN_EMAIL: z.string().email().default("admin@reachinbox.local"),
  ADMIN_PASSWORD: z.string().min(8).default("ReachInboxAdmin123"),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

