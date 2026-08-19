import { useState } from "react";
import { BrandLogo } from "../components/BrandLogo";
import { adminLogin } from "../lib/api";

export default function AdminLoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-fh-card">
      <header className="border-b border-fh-border-light bg-fh-white px-6 py-6">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <BrandLogo subtitle="Admin" />
          <a href="#/" className="text-sm font-medium text-fh-green">
            Back to app
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-sm font-medium text-fh-green">Administrator access</p>
        <h1 className="mt-2 text-3xl font-normal tracking-tight text-fh-heading">Sign in to admin</h1>
        <p className="mt-2 text-sm text-fh-body">
          Review all users, campaigns, and email activity from one console.
        </p>

        <form
          className="glass-card mt-8 space-y-4 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setSubmitting(true);
            try {
              await adminLogin(email.trim(), password);
              window.location.hash = "#/admin";
              onLoggedIn();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Login failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm text-fh-body" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="outbox-input"
              placeholder="admin@reachinbox.local"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-fh-body" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="outbox-input"
              required
            />
          </div>

          {error ? (
            <div className="rounded-fh border border-[#F3C5D2] bg-[#FDF0F3] px-4 py-3 text-sm text-fh-danger">
              {error}
            </div>
          ) : null}

          <button type="submit" className="outbox-btn-primary w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}
