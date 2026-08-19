import type { MeResponse } from "../types/api";
import { BrandLogo } from "./BrandLogo";
import { logout } from "../lib/api";

export function Header({ me }: { me: MeResponse }) {
  const initials = me.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-fh-border-light bg-fh-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <BrandLogo subtitle="Email scheduler" />

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="live-badge hidden md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-fh-green" />
            Online
          </span>

          <div className="flex items-center gap-3 rounded-fh border border-fh-border-light bg-fh-card px-3 py-2">
            {me.avatarUrl ? (
              <img
                src={me.avatarUrl}
                alt={`${me.name} avatar`}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fh-green/15 text-xs font-medium text-fh-green-deep">
                {initials}
              </div>
            )}
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-fh-heading">{me.name}</div>
              <div className="max-w-[180px] truncate text-xs text-fh-muted">{me.email}</div>
            </div>
          </div>

          <button type="button" className="outbox-btn-secondary px-4 py-2 text-xs" onClick={() => void logout()}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
