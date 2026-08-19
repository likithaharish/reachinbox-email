import type { ReactNode } from "react";

type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
};

function EmptyState({ title }: { title: string }) {
  return (
    <div className="glass-card flex min-h-[32rem] flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-fh bg-fh-card text-fh-green-deep">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-fh-body">{title}</p>
    </div>
  );
}

function EmailAvatar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fh-card text-xs font-medium text-fh-green-deep">
        {initial}
      </div>
      <span className="truncate font-medium text-fh-heading">{email}</span>
    </div>
  );
}

export function EmailTable<T extends { email: string }>({
  rows,
  columns,
  emptyTitle,
  minRows = 20,
}: {
  rows: T[];
  columns: Column<T>[];
  emptyTitle: string;
  minRows?: number;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  const enhancedColumns = columns.map((col) =>
    col.header === "Email"
      ? {
          ...col,
          cell: (row: T) => <EmailAvatar email={row.email} />,
        }
      : col,
  );

  const fillerCount = Math.max(0, minRows - rows.length);

  return (
    <div className="glass-card overflow-hidden">
      <div className="max-h-[32rem] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-fh-border-light bg-fh-card">
              {enhancedColumns.map((c) => (
                <th
                  key={c.header}
                  scope="col"
                  className="px-5 py-3.5 text-[11px] font-medium uppercase tracking-widest text-fh-muted"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="table-row-hover last:border-0">
                {enhancedColumns.map((c) => (
                  <td key={c.header} className="h-14 px-5 py-3 text-sm text-fh-body">
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {Array.from({ length: fillerCount }).map((_, idx) => (
              <tr key={`empty-${idx}`} className="border-b border-fh-border-light/70 last:border-0">
                {enhancedColumns.map((c) => (
                  <td key={c.header} className="h-14 px-5 py-3 text-sm text-fh-border">
                    —
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
