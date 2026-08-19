import type { MeResponse } from "../types/api";
import type {
  PaginatedResponse,
  ScheduledEmailRow,
  SentEmailRow,
  ScheduleEmailBatchResponse,
  AdminMetrics,
  AdminUserRow,
  AdminActivityRow,
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5177";

export function getEmailPreviewUrl(token: string) {
  return `${API_BASE_URL}/preview/${token}`;
}

export async function completeGoogleSession(ticket: string): Promise<MeResponse> {
  const result = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ticket }),
  });

  if (!result.ok) {
    throw new Error("Google login did not complete. Please try again.");
  }

  const json = (await result.json()) as { data: MeResponse };
  return json.data;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    // Still leave the SPA even if the API is unreachable.
  }
  window.location.hash = "#/";
  window.location.reload();
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

export function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/api/v1/me");
}

export function getScheduledEmails(
  params: { page?: number; pageSize?: number } = {},
): Promise<PaginatedResponse<ScheduledEmailRow>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  return request<PaginatedResponse<ScheduledEmailRow>>(`/api/v1/emails/scheduled?page=${page}&pageSize=${pageSize}`);
}

export function getSentEmails(
  params: { page?: number; pageSize?: number } = {},
): Promise<PaginatedResponse<SentEmailRow>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  return request<PaginatedResponse<SentEmailRow>>(`/api/v1/emails/sent?page=${page}&pageSize=${pageSize}`);
}

export async function scheduleEmailBatch(input: {
  subject: string;
  body: string;
  leads: string[];
  startTime: string; // datetime-local value converted to ISO before calling
  minDelaySeconds: number;
  hourlyLimitPerSender: number;
}): Promise<ScheduleEmailBatchResponse> {
  const result = await fetch(`${API_BASE_URL}/api/v1/email-batches`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!result.ok) {
    let message = `Schedule request failed (${result.status})`;
    try {
      const body = (await result.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    if (result.status === 401) {
      message = "Session expired. Please sign in with Google again.";
    }
    throw new Error(message);
  }

  const json = (await result.json()) as { data: ScheduleEmailBatchResponse };
  return json.data;
}

export async function adminLogin(email: string, password: string): Promise<MeResponse> {
  const result = await fetch(`${API_BASE_URL}/api/v1/admin/sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!result.ok) {
    throw new Error("Invalid admin credentials");
  }

  const json = (await result.json()) as { data: MeResponse };
  return json.data;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const json = await request<{ data: AdminMetrics }>("/api/v1/admin/metrics");
  return json.data;
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const json = await request<{ data: AdminUserRow[] }>("/api/v1/admin/users");
  return json.data;
}

export function getAdminEmails(
  params: { page?: number; pageSize?: number; userId?: string } = {},
): Promise<PaginatedResponse<AdminActivityRow>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const userQuery = params.userId ? `&userId=${encodeURIComponent(params.userId)}` : "";
  return request<PaginatedResponse<AdminActivityRow>>(
    `/api/v1/admin/emails?page=${page}&pageSize=${pageSize}${userQuery}`,
  );
}

export async function deleteAllAdminEmails(): Promise<{ deletedEmails: number; deletedBatches: number }> {
  const result = await fetch(`${API_BASE_URL}/api/v1/admin/emails`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!result.ok) {
    throw new Error("Failed to delete emails");
  }

  const json = (await result.json()) as { data: { deletedEmails: number; deletedBatches: number } };
  return json.data;
}

