import { useCallback, useEffect, useRef, useState } from "react";

function TypingLine({
  text,
  active,
  onComplete,
}: {
  text: string;
  active: boolean;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, 22);

    return () => window.clearInterval(timer);
  }, [active, text]);

  return (
    <span>
      {displayed}
      {active && displayed.length < text.length ? (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-fh-green align-middle" />
      ) : null}
    </span>
  );
}

const WORKFLOWS = [
  "Schedule 200 welcome emails starting tomorrow 9 AM",
  "Throttle to 100/hour with 5s delay between sends",
  "Upload CSV leads and launch a follow-up sequence",
];

export function QueuePreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lineDone, setLineDone] = useState(false);

  const handleLineComplete = useCallback(() => setLineDone(true), []);

  useEffect(() => {
    if (!lineDone) return;
    const timer = window.setTimeout(() => {
      setLineDone(false);
      setActiveIndex((i) => (i + 1) % WORKFLOWS.length);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [lineDone, activeIndex]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-fh-white p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-fh-green" />
          <span className="text-xs font-medium text-fh-body">Queue preview</span>
        </div>
        <span className="rounded-md border border-fh-border px-2 py-0.5 font-mono text-[10px] text-fh-muted">
          scheduler
        </span>
      </div>

      <div className="mb-4 rounded-fh border border-fh-border bg-fh-card p-4 font-mono text-xs">
        <div className="mb-3 flex items-center gap-2 text-fh-muted">
          <span className="text-fh-green">→</span>
          <span>reachinbox-scheduler</span>
        </div>
        <div className="min-h-[4.5rem] text-sm leading-relaxed text-fh-heading">
          <TypingLine
            key={activeIndex}
            text={WORKFLOWS[activeIndex]}
            active
            onComplete={handleLineComplete}
          />
        </div>
      </div>

      <div className="space-y-2">
        {WORKFLOWS.map((workflow, i) => (
          <div
            key={workflow}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-xs transition ${
              i === activeIndex
                ? "border-fh-green/40 bg-[#EDF5ED] text-fh-heading"
                : "border-fh-border-light bg-fh-white text-fh-muted"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${i === activeIndex ? "bg-fh-green" : "bg-fh-border"}`} />
            <span className="truncate">{workflow}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-fh border border-fh-green/25 bg-[#EDF5ED] p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-fh-green-dark">
          All systems operational
        </div>
        <p className="mt-2 text-xs text-fh-body">BullMQ · Redis · PostgreSQL · Ethereal SMTP</p>
      </div>
    </div>
  );
}
