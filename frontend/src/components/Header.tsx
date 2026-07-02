import type { IntegrationStatus } from "../types";

interface HeaderProps {
  status: IntegrationStatus | null;
  refreshing: boolean;
  onRefresh: () => void;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - Date.parse(iso);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Header({ status, refreshing, onRefresh }: HeaderProps) {
  const missing: string[] = [];
  if (status && !status.adzuna) missing.push("Adzuna");
  if (status && !status.claude) missing.push("Claude AI scoring");

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Job Market Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Last synced {timeAgo(status?.lastRefreshed ?? null)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh Data"}
        </button>
      </div>
      {missing.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-50 px-6 py-2 text-center text-sm text-amber-800">
          Add API keys for {missing.join(" and ")} in <code>backend/.env</code> to unlock more
          listings and AI-powered scoring.
        </div>
      )}
    </header>
  );
}
