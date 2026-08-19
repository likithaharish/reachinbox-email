const styles: Record<string, { badge: string; dot: string }> = {
  pending: {
    badge: "border-[#E8D48B] bg-[#FBF6E4] text-[#8A6D1B]",
    dot: "bg-[#C9A227]",
  },
  sent: {
    badge: "border-fh-green/30 bg-[#EDF5ED] text-fh-green-dark",
    dot: "bg-fh-green",
  },
  failed: {
    badge: "border-[#F3C5D2] bg-[#FDF0F3] text-fh-danger",
    dot: "bg-fh-danger",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const style = styles[status] ?? {
    badge: "border-fh-border bg-fh-card text-fh-muted",
    dot: "bg-fh-dim",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
