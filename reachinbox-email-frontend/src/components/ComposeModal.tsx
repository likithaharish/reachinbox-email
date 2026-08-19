import { useEffect, useMemo, useRef, useState } from "react";
import { mergeLeadEmails, parseLeadEmailsFromText } from "../lib/csvParser";
import { scheduleEmailBatch } from "../lib/api";

export function ComposeModal({
  open,
  onClose,
  onScheduled,
}: {
  open: boolean;
  onClose: () => void;
  onScheduled: () => void;
}) {
  const initialStartTime = useMemo(() => {
    const d = new Date(Date.now() + 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }, []);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [leadSource, setLeadSource] = useState<"file" | "emails">("file");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileEmails, setFileEmails] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualText, setManualText] = useState("");
  const [singleEmail, setSingleEmail] = useState("");

  const [startTimeLocal, setStartTimeLocal] = useState(initialStartTime);
  const [minDelaySeconds, setMinDelaySeconds] = useState(2);
  const [hourlyLimitPerSender, setHourlyLimitPerSender] = useState(200);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leads = useMemo(() => {
    if (leadSource === "file") return mergeLeadEmails(fileEmails);
    return mergeLeadEmails(parseLeadEmailsFromText(manualText));
  }, [leadSource, fileEmails, manualText]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
  }, [open]);

  async function handleFile(file: File) {
    setError(null);
    const text = await file.text();
    setFileEmails(parseLeadEmailsFromText(text));
  }

  function addSingleEmail() {
    const parsed = parseLeadEmailsFromText(singleEmail);
    if (parsed.length === 0) {
      setError("Enter a valid email address");
      return;
    }
    setManualText((current) => (current.trim() ? `${current.trim()}\n${parsed.join("\n")}` : parsed.join("\n")));
    setSingleEmail("");
    setError(null);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), rgba(55,85,83,0.9)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Compose new email batch"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-fh bg-fh-white shadow-card animate-fade-in-up"
      >
        <div className="flex items-start justify-between gap-4 border-b border-fh-border px-5 py-4">
          <div>
            <h3 className="text-lg font-normal text-fh-heading">Compose campaign</h3>
            <p className="mt-1 text-sm text-fh-body">
              Add recipients from a file or by typing email IDs, then set pacing and schedule delivery.
            </p>
          </div>
          <button
            type="button"
            className="rounded-fh border border-fh-border px-3 py-1.5 text-sm text-fh-muted transition hover:border-fh-green hover:text-fh-navy"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-5 px-6 py-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);

            if (!subject.trim()) return setError("Subject is required");
            if (!body.trim()) return setError("Body is required");
            if (leads.length === 0) {
              return setError(
                leadSource === "file"
                  ? "Select a CSV or text file with at least one email ID"
                  : "Enter at least one email ID",
              );
            }

            const startTime = new Date(startTimeLocal);
            if (Number.isNaN(startTime.getTime())) return setError("Invalid start time");

            try {
              setSubmitting(true);
              await scheduleEmailBatch({
                subject: subject.trim(),
                body,
                leads,
                startTime: startTime.toISOString(),
                minDelaySeconds,
                hourlyLimitPerSender,
              });

              onScheduled();
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to schedule emails");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-fh-body" htmlFor="subject">
                Subject line
              </label>
              <input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="outbox-input"
                placeholder="Quick question about your pipeline"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-fh-body" htmlFor="body">
                Email body
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="outbox-input min-h-32 resize-y"
                placeholder="Write your outreach message…"
              />
            </div>

            <div className="rounded-fh border border-fh-green/30 bg-fh-card p-4">
              <p className="mb-3 text-sm text-fh-body">Recipients</p>
              {/* Two methods, one picker each: "From file" is the mode, "Select CSV or TXT" opens the dialog. */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={
                    leadSource === "file"
                      ? "rounded-fh bg-fh-green px-3 py-2 text-sm font-medium text-white"
                      : "rounded-fh border border-fh-border bg-fh-white px-3 py-2 text-sm text-fh-body hover:border-fh-green"
                  }
                  onClick={() => setLeadSource("file")}
                >
                  From file
                </button>
                <button
                  type="button"
                  className={
                    leadSource === "emails"
                      ? "rounded-fh bg-fh-green px-3 py-2 text-sm font-medium text-white"
                      : "rounded-fh border border-fh-border bg-fh-white px-3 py-2 text-sm text-fh-body hover:border-fh-green"
                  }
                  onClick={() => setLeadSource("emails")}
                >
                  Type emails
                </button>
              </div>

              {leadSource === "file" ? (
                <div>
                  <input
                    id="leads"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFileName(file.name);
                      void handleFile(file);
                    }}
                  />
                  <button
                    type="button"
                    className="outbox-btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select CSV or TXT
                  </button>
                  {fileName ? (
                    <p className="mt-2 text-sm text-fh-body">
                      <span className="font-medium text-fh-heading">{fileEmails.length}</span> emails from{" "}
                      <span className="text-fh-green-dark">{fileName}</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-fh-muted">One email per line, or a CSV with an email column.</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm text-fh-body" htmlFor="single-email">
                    Add one email ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="single-email"
                      type="email"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSingleEmail();
                        }
                      }}
                      className="outbox-input"
                      placeholder="name@company.com"
                    />
                    <button type="button" className="outbox-btn-secondary shrink-0" onClick={addSingleEmail}>
                      Add
                    </button>
                  </div>
                  <label className="mb-2 mt-4 block text-sm text-fh-body" htmlFor="manual-leads">
                    Or paste multiple email IDs
                  </label>
                  <textarea
                    id="manual-leads"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    className="outbox-input min-h-24 resize-y"
                    placeholder={"alice@company.com\nbob@startup.io, carol@agency.com"}
                  />
                </div>
              )}

              <p className="mt-3 text-sm text-fh-body">
                Total unique emails: <span className="font-medium text-fh-heading">{leads.length}</span>
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm text-fh-body" htmlFor="startTime">
                  Start time
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  value={startTimeLocal}
                  onChange={(e) => setStartTimeLocal(e.target.value)}
                  className="outbox-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-fh-body" htmlFor="minDelaySeconds">
                  Min delay (s)
                </label>
                <input
                  id="minDelaySeconds"
                  type="number"
                  min={0}
                  step={1}
                  value={minDelaySeconds}
                  onChange={(e) => setMinDelaySeconds(Number(e.target.value))}
                  className="outbox-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-fh-body" htmlFor="hourlyLimitPerSender">
                  Hourly cap
                </label>
                <input
                  id="hourlyLimitPerSender"
                  type="number"
                  min={0}
                  step={1}
                  value={hourlyLimitPerSender}
                  onChange={(e) => setHourlyLimitPerSender(Number(e.target.value))}
                  className="outbox-input"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-fh border border-[#F3C5D2] bg-[#FDF0F3] px-4 py-3 text-sm text-fh-danger">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-fh-border pt-5">
            <p className="hidden text-xs text-fh-muted sm:block">
              Jobs queued via BullMQ · Idempotent · Rate-limited
            </p>
            <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
              <button type="button" className="outbox-btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="outbox-btn-accent min-w-[140px]">
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Scheduling…
                  </>
                ) : (
                  "Schedule batch"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
