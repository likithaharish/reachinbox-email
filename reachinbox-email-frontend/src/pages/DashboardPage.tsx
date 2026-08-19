import { useEffect, useMemo, useState } from "react";
import type { MeResponse, ScheduledEmailRow, SentEmailRow } from "../types/api";
import { getScheduledEmails, getSentEmails, getEmailPreviewUrl } from "../lib/api";
import { AmbientBackground } from "../components/AmbientBackground";
import { Header } from "../components/Header";
import { EmailTable } from "../components/EmailTable";
import { ComposeModal } from "../components/ComposeModal";
import { StatusBadge } from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";

type TabKey = "scheduled" | "sent";

export default function DashboardPage({ me }: { me: MeResponse }) {
  const [activeTab, setActiveTab] = useState<TabKey>("scheduled");
  const [composeOpen, setComposeOpen] = useState(false);

  const [scheduled, setScheduled] = useState<ScheduledEmailRow[]>([]);
  const [sent, setSent] = useState<SentEmailRow[]>([]);

  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);

  const [scheduledPage, setScheduledPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  const [scheduledTotalCount, setScheduledTotalCount] = useState(0);
  const [sentTotalCount, setSentTotalCount] = useState(0);
  const pageSize = 20;

  const currentPage = activeTab === "scheduled" ? scheduledPage : sentPage;
  const currentTotalCount = activeTab === "scheduled" ? scheduledTotalCount : sentTotalCount;
  const hasNextPage = currentPage * pageSize < currentTotalCount;
  const pendingCount = useMemo(
    () => scheduled.filter((r) => r.status === "pending").length,
    [scheduled],
  );
  const sentCount = sent.filter((r) => r.status === "sent").length;
  const failedCount = [...scheduled, ...sent].filter((r) => r.status === "failed").length;

  const scheduledColumns = useMemo(
    () => [
      { header: "Email", cell: (r: ScheduledEmailRow) => r.email },
      { header: "Subject", cell: (r: ScheduledEmailRow) => r.subject },
      {
        header: "Scheduled time",
        cell: (r: ScheduledEmailRow) => (
          <span className="font-mono text-xs text-fh-muted">
            {new Date(r.scheduledTime).toLocaleString()}
          </span>
        ),
      },
      { header: "Status", cell: (r: ScheduledEmailRow) => <StatusBadge status={r.status} /> },
    ],
    [],
  );

  const sentColumns = useMemo(
    () => [
      { header: "Email", cell: (r: SentEmailRow) => r.email },
      { header: "Subject", cell: (r: SentEmailRow) => r.subject },
      {
        header: "Sent time",
        cell: (r: SentEmailRow) => (
          <span className="font-mono text-xs text-fh-muted">
            {r.sentTime ? new Date(r.sentTime).toLocaleString() : "—"}
          </span>
        ),
      },
      { header: "Status", cell: (r: SentEmailRow) => <StatusBadge status={r.status} /> },
      {
        header: "Preview",
        cell: (r: SentEmailRow) =>
          r.previewToken ? (
            <a
              className="text-sm font-medium text-fh-green-dark underline-offset-2 hover:underline"
              href={getEmailPreviewUrl(r.previewToken)}
              target="_blank"
              rel="noreferrer"
            >
              Open catcher
            </a>
          ) : (
            <span className="text-sm text-fh-border">—</span>
          ),
      },
    ],
    [],
  );

  async function refreshScheduled(page: number) {
    setScheduledLoading(true);
    try {
      const res = await getScheduledEmails({ page, pageSize });
      setScheduled(res.data);
      setScheduledTotalCount(res.totalCount);
    } finally {
      setScheduledLoading(false);
    }
  }

  async function refreshSent(page: number) {
    setSentLoading(true);
    try {
      const res = await getSentEmails({ page, pageSize });
      setSent(res.data);
      setSentTotalCount(res.totalCount);
    } finally {
      setSentLoading(false);
    }
  }

  useEffect(() => {
    void refreshScheduled(scheduledPage);
  }, [scheduledPage]);

  useEffect(() => {
    void refreshSent(sentPage);
  }, [sentPage]);

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />
      <Header me={me} />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Hero strip */}
        <div className="mb-8 animate-fade-in-up flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-fh-green">Overview</p>
            <h1 className="text-3xl font-normal tracking-tight text-fh-heading sm:text-4xl">
              Welcome back, {me.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-fh-body">
              Monitor campaigns, tune delivery pacing, and review outbound performance in one place.
            </p>
          </div>

          <button
            type="button"
            className="outbox-btn-accent"
            onClick={() => setComposeOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            New Campaign
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Scheduled"
            value={scheduledLoading ? "…" : scheduled.length}
            hint="In current page view"
            accent="violet"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="Pending"
            value={scheduledLoading ? "…" : pendingCount}
            hint="Awaiting send window"
            accent="cyan"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
          />
          <StatCard
            label="Delivered"
            value={sentLoading ? "…" : sentCount}
            hint="Successfully sent"
            accent="emerald"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
          <StatCard
            label="Failed"
            value={failedCount}
            hint="Needs attention"
            accent="pink"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`outbox-tab ${activeTab === "scheduled" ? "outbox-tab-active" : "outbox-tab-inactive"}`}
            onClick={() => setActiveTab("scheduled")}
          >
            Scheduled
            {!scheduledLoading && scheduled.length > 0 ? (
              <span className="ml-1.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px]">
                {scheduled.length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className={`outbox-tab ${activeTab === "sent" ? "outbox-tab-active" : "outbox-tab-inactive"}`}
            onClick={() => setActiveTab("sent")}
          >
            Sent
            {!sentLoading && sent.length > 0 ? (
              <span className="ml-1.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[10px]">
                {sent.length}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className="ml-auto outbox-btn-secondary px-3 py-2 text-xs"
            onClick={() =>
              activeTab === "scheduled"
                ? void refreshScheduled(scheduledPage)
                : void refreshSent(sentPage)
            }
          >
            ↻ Refresh
          </button>
        </div>

        {/* Table */}
        <main className="animate-fade-in">
          {activeTab === "scheduled" ? (
            scheduledLoading ? (
              <div className="glass-card space-y-4 p-8">
                <div className="shimmer-line w-1/3" />
                <div className="shimmer-line w-full" />
                <div className="shimmer-line w-5/6" />
                <div className="shimmer-line w-4/6" />
              </div>
            ) : (
              <EmailTable
                rows={scheduled}
                columns={scheduledColumns}
                emptyTitle="No scheduled emails yet. Create your first campaign to get started."
              />
            )
          ) : sentLoading ? (
            <div className="glass-card space-y-4 p-8">
              <div className="shimmer-line w-1/3" />
              <div className="shimmer-line w-full" />
              <div className="shimmer-line w-5/6" />
            </div>
          ) : (
            <EmailTable
              rows={sent}
              columns={sentColumns}
              emptyTitle="No sent emails yet. Completed deliveries will appear here."
            />
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-xs text-fh-muted">
              Page {currentPage} · {currentTotalCount} total · {pageSize} per page
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="outbox-btn-secondary px-3 py-2 text-xs"
                onClick={() =>
                  activeTab === "scheduled"
                    ? setScheduledPage((p) => Math.max(1, p - 1))
                    : setSentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage === 1}
              >
                ← Prev
              </button>
              <button
                type="button"
                className="outbox-btn-secondary px-3 py-2 text-xs"
                onClick={() =>
                  activeTab === "scheduled"
                    ? setScheduledPage((p) => p + 1)
                    : setSentPage((p) => p + 1)
                }
                disabled={!hasNextPage}
              >
                Next →
              </button>
            </div>
          </div>
        </main>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onScheduled={() => {
          void refreshScheduled(1);
          setScheduledPage(1);
          setActiveTab("scheduled");
        }}
      />
    </div>
  );
}
