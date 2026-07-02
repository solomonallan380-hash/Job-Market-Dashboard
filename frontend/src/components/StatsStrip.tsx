import type { Job } from "../types";

interface StatsStripProps {
  jobs: Job[];
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export function StatsStrip({ jobs }: StatsStripProps) {
  const companies = new Set(jobs.map((job) => job.company)).size;
  const remotePct = jobs.length ? Math.round((jobs.filter((j) => j.remote).length / jobs.length) * 100) : 0;
  const salaries = jobs
    .map((job) => job.salaryMax ?? job.salaryMin)
    .filter((v): v is number => Boolean(v && v > 0));
  const avgSalary = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : null;
  const entryPct = jobs.length
    ? Math.round((jobs.filter((j) => j.experienceLevel === "entry").length / jobs.length) * 100)
    : 0;

  const stats = [
    { label: "Job Postings", value: jobs.length.toLocaleString() },
    { label: "Companies", value: companies.toLocaleString() },
    { label: "Remote", value: `${remotePct}%` },
    { label: "Avg. Salary", value: avgSalary ? formatCurrency(avgSalary) : "N/A" },
    { label: "Entry Level", value: `${entryPct}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
