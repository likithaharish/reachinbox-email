import { AmbientBackground } from "./AmbientBackground";
import { BrandLogo } from "./BrandLogo";

export function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-fh-white">
      <AmbientBackground />
      <div className="relative z-10 flex animate-fade-in flex-col items-center gap-8">
        <BrandLogo subtitle="Email scheduler" size="lg" />
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-fh-border border-t-fh-green" />
          <p className="text-sm text-fh-body">Loading your workspace…</p>
        </div>
      </div>
    </div>
  );
}
