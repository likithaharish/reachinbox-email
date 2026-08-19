import { Queue } from "bullmq";
import { env } from "../config/env";
import { createRedisConnection } from "./connection";

export interface SendEmailJobData {
  scheduledEmailId: string;
}

export const emailQueue = new Queue<SendEmailJobData>(env.BULLMQ_QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 20,
    attempts: 3,
  },
});

