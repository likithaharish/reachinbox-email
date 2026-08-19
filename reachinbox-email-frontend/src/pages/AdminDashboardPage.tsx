import { useEffect, useMemo, useState } from "react";
import type { AdminActivityRow, AdminMetrics, AdminUserRow, MeResponse } from "../types/api";
import { deleteAllAdminEmails, getAdminEmails, getAdminMetrics, getAdminUsers, getEmailPreviewUrl, logout } from "../lib/api";
import { BrandLogo } from "../components/BrandLogo";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";

export default function AdminDashboardPage({ me }: { me: MeResponse }) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [activity, setActivity] = useState<AdminActivityRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pageSize = 20;

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  async function refresh() {
    setLoading(true);
    try {
      const [metricsRes, usersRes, emailsRes] = await Promise.all([
        getAdminMetrics(),
        getAdminUsers(),
        getAdminEmails({ page, pageSize, userId: selectedUserId || undefined }),
      ]);
      setMetrics(metricsRes);
      setUsers(usersRes);
      setActivity(emailsRes.data);
      setTotalCount(emailsRes.totalCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedUserId]);

  return (
    <div className="min-h-screen bg-fh-card">
      <header className="sticky top-0 z-40 border-b border-fh-border-light bg-fh-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <BrandLogo subtitle="Admin console" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-fh-heading">{me.name}</div>
              <div className="text-xs text-fh-muted">{me.email}</div>
            </div>
            <button type="button" className="outbox-btn-secondary px-4 py-2 text-xs" onClick={() => void logout()}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-fh-green">Operations</p>
            <h1 className="mt-1 text-3xl font-normal tracking-tight text-fh-heading">User activity</h1>
            <p className="mt-2 text-sm text-fh-body">
              All Google users, campaigns, and outbound email jobs across the platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="outbox-btn-secondary" onClick={() => void refresh()}>
              Refresh
            </button>
            <button
              type="button"
              className="rounded-fh border border-fh-danger bg-fh-white px-5 py-2.5 text-sm font-medium text-fh-danger transition hover:bg-[#FDF0F3] disabled:opacity-50"
              disabled={
                deleting ||
                !metrics ||
                metrics.pendingCount + metrics.sentCount + metrics.failedCount + metrics.batchCount === 0
              }
              onClick={() => {
                const confirmed = window.confirm(
                  "Delete all emails and campaigns for every user? This cannot be undone.",
                );
                if (!confirmed) return;

                setDeleteError(null);
                setDeleting(true);
                void (async () => {
                  try {
                    await deleteAllAdminEmails();
                    setSelectedUserId("");
                    setPage(1);
                    await refresh();
                  } catch (error) {
                    setDeleteError(error instanceof Error ? error.message : "Failed to delete emails");
                  } finally {
                    setDeleting(false);
                  }
                })();
              }}
            >
              {deleting ? "Deleting…" : "Delete all emails"}
            </button>
          </div>
        </div>
        {deleteError ? (
          <div className="mb-6 rounded-fh border border-[#F3C5D2] bg-[#FDF0F3] px-4 py-3 text-sm text-fh-danger">
            {deleteError}
          </div>
        ) : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Users"
            value={metrics?.userCount ?? "…"}
            hint="Google accounts"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 19c.8-3 2.8-4.5 5-4.5S13.2 16 14 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="Campaigns"
            value={metrics?.batchCount ?? "…"}
            hint="Email batches"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
          />
          <StatCard
            label="Pending"
            value={metrics?.pendingCount ?? "…"}
            hint="Queued sends"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
          />
          <StatCard
            label="Delivered"
            value={metrics?.sentCount ?? "…"}
            hint="Successfully sent"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="Failed"
            value={metrics?.failedCount ?? "…"}
            hint="Needs attention"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
        </div>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-fh-heading">Users</h2>
            {selectedUser ? (
              <button
                type="button"
                className="text-sm text-fh-green"
                onClick={() => {
                  setSelectedUserId("");
                  setPage(1);
                }}
              >
                Clear filter
              </button>
            ) : null}
          </div>

          <div className="glass-card overflow-hidden">
            {users.length === 0 ? (
              <div className="p-10 text-center text-sm text-fh-muted">No users have signed in yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-fh-border-light bg-fh-card">
                      {["User", "Joined", "Campaigns", "Pending", "Sent", "Failed", ""].map((h) => (
                        <th key={h} className="px-5 py-3 text-[11px] font-medium uppercase tracking-widest text-fh-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="table-row-hover last:border-0">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fh-card text-xs font-medium text-fh-green-deep">
                                {user.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-fh-heading">{user.name}</div>
                              <div className="text-xs text-fh-muted">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-fh-body">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-sm text-fh-heading">{user.batchCount}</td>
                        <td className="px-5 py-4 text-sm text-fh-heading">{user.pendingCount}</td>
                        <td className="px-5 py-4 text-sm text-fh-heading">{user.sentCount}</td>
                        <td className="px-5 py-4 text-sm text-fh-heading">{user.failedCount}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            className="text-sm font-medium text-fh-green"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setPage(1);
                            }}
                          >
                            View activity
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-medium text-fh-heading">
            {selectedUser ? `Activity · ${selectedUser.name}` : "All email activity"}
          </h2>

          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="space-y-3 p-8">
                <div className="shimmer-line w-1/3" />
                <div className="shimmer-line w-full" />
                <div className="shimmer-line w-5/6" />
              </div>
            ) : activity.length === 0 ? (
              <div className="p-10 text-center text-sm text-fh-muted">No email activity yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="border-b border-fh-border-light bg-fh-card">
                      {["User", "Recipient", "Subject", "Scheduled", "Sent", "Status", "Preview"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[11px] font-medium uppercase tracking-widest text-fh-muted">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((row) => (
                      <tr key={row.id} className="table-row-hover last:border-0">
                        <td className="px-5 py-4 text-sm text-fh-heading">
                          {row.user ? (
                            <div>
                              <div className="font-medium">{row.user.name}</div>
                              <div className="text-xs text-fh-muted">{row.user.email}</div>
                            </div>
                          ) : (
                            <span className="text-fh-muted">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-fh-body">{row.email}</td>
                        <td className="px-5 py-4 text-sm text-fh-heading">{row.subject}</td>
                        <td className="px-5 py-4 font-mono text-xs text-fh-muted">
                          {new Date(row.scheduledTime).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-fh-muted">
                          {row.sentTime ? new Date(row.sentTime).toLocaleString() : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-5 py-4">
                          {row.previewToken ? (
                            <a
                              className="text-sm font-medium text-fh-green-dark underline-offset-2 hover:underline"
                              href={getEmailPreviewUrl(row.previewToken)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open catcher
                            </a>
                          ) : (
                            <span className="text-fh-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-fh-muted">
              Page {page} · {totalCount} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="outbox-btn-secondary px-3 py-2 text-xs"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="outbox-btn-secondary px-3 py-2 text-xs"
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
