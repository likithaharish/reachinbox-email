export function BrandLogo({
  subtitle,
  size = "md",
  invert = false,
}: {
  subtitle?: string;
  size?: "md" | "lg";
  invert?: boolean;
}) {
  const iconSize = size === "lg" ? "h-9 w-9" : "h-8 w-8";
  const titleSize = size === "lg" ? "text-lg" : "text-base";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${iconSize} items-center justify-center rounded-lg ${
          invert ? "bg-white/15 text-white" : "bg-fh-card text-fh-green-deep"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div
          className={`${titleSize} font-medium tracking-tight ${invert ? "text-white" : "text-fh-navy"}`}
        >
          ReachInbox
        </div>
        {subtitle ? (
          <div className={`text-xs ${invert ? "text-white/70" : "text-fh-muted"}`}>{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}
