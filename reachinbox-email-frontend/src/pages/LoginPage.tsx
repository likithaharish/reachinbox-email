import { BrandLogo } from "../components/BrandLogo";
import { QueuePreview } from "../components/QueuePreview";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5177";

const FEATURES = [
  {
    title: "Precision timing",
    desc: "Delayed jobs with zero cron — exact send windows.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="#21503b" strokeWidth="1.5" />
        <path d="M10 6v4l2.5 1.5" stroke="#21503b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Adaptive throttling",
    desc: "Hourly caps and per-sender pacing built in.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <polyline
          points="3,14 7,10 11,13 17,6"
          stroke="#21503b"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="17" cy="6" r="1.5" fill="#21503b" />
      </svg>
    ),
  },
  {
    title: "Live telemetry",
    desc: "Track scheduled, sent, and failed emails in real time.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M3 16V4M3 16h14M7 13v-3M11 13V8M15 13v-5" stroke="#21503b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-fh-white">
      <header className="fixed inset-x-0 top-0 z-40 bg-fh-white px-6 py-6 lg:px-16">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <a href="#/admin" className="text-sm font-medium text-fh-body hover:text-fh-navy">
              Admin
            </a>
            <a href={`${API_BASE_URL}/auth/google`} className="outbox-btn-secondary hidden sm:inline-flex">
              Continue with Google
            </a>
          </div>
        </div>
      </header>

      <main className="pt-[88px]">
        <section className="relative mx-4 overflow-hidden rounded-fh-lg bg-fh-navy px-6 py-16 sm:px-12 lg:mx-6 lg:min-h-[640px] lg:px-20 lg:py-24">
          <div className="absolute inset-0 bg-fh-hero" />
          <div className="relative z-10 grid items-end gap-12 lg:grid-cols-2">
            <div>
              <h1 className="max-w-xl text-[40px] font-normal leading-[48px] tracking-[-0.64px] text-white lg:text-[48px] lg:leading-[56px]">
                Schedule outreach at production scale
              </h1>
              <p className="mt-6 max-w-lg text-xl leading-6 tracking-[-0.2px] text-white/90">
                Queue thousands of sends with rate limits, idempotent workers, and a command center built for outbound teams.
              </p>
              <a href={`${API_BASE_URL}/auth/google`} className="outbox-btn-primary mt-8 inline-flex">
                Continue with Google
              </a>
            </div>
            <QueuePreview />
          </div>
        </section>

        <section className="bg-gradient-to-b from-fh-card to-fh-white px-6 py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-medium text-fh-green">Core capabilities</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-normal tracking-tight text-fh-heading">
              These three pillars keep outbound delivery predictable and controllable.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="glass-card-hover p-6">
                  <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md bg-fh-card">
                    {f.icon}
                  </div>
                  <h3 className="text-base font-medium text-fh-heading">{f.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-fh-body">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-fh-border-light px-6 py-8 text-center text-sm text-fh-muted">
        Production-grade email infrastructure · React + Express + BullMQ
      </footer>
    </div>
  );
}
