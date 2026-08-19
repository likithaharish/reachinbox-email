export interface MeResponse {
  name: string;
  email: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}

export type EmailStatus = "pending" | "sent" | "failed";

export interface ScheduledEmailRow {
  id: string;
  email: string;
  subject: string;
  scheduledTime: string;
  status: EmailStatus;
}

export interface SentEmailRow {
  id: string;
  email: string;
  subject: string;
  sentTime: string | null;
  status: EmailStatus;
  previewToken: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ScheduleEmailBatchResponse {
  batchId: string | null;
  scheduledCount: number;
  leadsCount: number;
}

export interface AdminMetrics {
  userCount: number;
  batchCount: number;
  pendingCount: number;
  sentCount: number;
  failedCount: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  batchCount: number;
  pendingCount: number;
  sentCount: number;
  failedCount: number;
}

export interface AdminActivityRow {
  id: string;
  email: string;
  subject: string;
  scheduledTime: string;
  sentTime: string | null;
  status: EmailStatus;
  errorMessage: string | null;
  user: { id: string; name: string; email: string } | null;
  previewToken?: string | null;
}

