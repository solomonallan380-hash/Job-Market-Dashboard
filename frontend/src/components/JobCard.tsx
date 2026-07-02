import type { ExperienceLevel, Job } from "../types";

const EXPERIENCE_STYLES: Record<ExperienceLevel, string> = {
  entry: "bg-emerald-100 text-emerald-700",
  mid: "bg-blue-100 text-blue-700",
  senior: "bg-purple-100 text-purple-700",
  unknown: "bg-slate-100 text-slate-600",
};

function formatSalary(job: Job): string | null {
  const min = job.salaryMin;
  const max = job.salaryMax;
  if (!min && !max) return null;
  const currency = job.salaryCurrency ?? "USD";
  const fmt = (n: number) => `${currency === "USD" ? "$" : currency + " "}${Math.round(n).toLocaleString()}`;
  if (min && max && min !== max) return `${fmt(min)} - ${fmt(max)}`;
  return fmt(max ?? min ?? 0);
}

export function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{job.title}</h3>
          <p className="text-sm text-slate-500">
            {job.company} · {job.location}
          </p>
        </div>
        {job.matchScore !== null && (
          <div className="shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-center">
            <p className="text-sm font-bold text-brand-700">{job.matchScore}%</p>
            <p className="text-[10px] uppercase text-brand-500">match</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {job.remote && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">Remote</span>
        )}
        <span className={`rounded-full px-2.5 py-1 font-medium capitalize ${EXPERIENCE_STYLES[job.experienceLevel]}`}>
          {job.experienceLevel}
        </span>
        {salary && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">{salary}</span>
        )}
        <span className="rounded-full bg-slate-50 px-2.5 py-1 font-medium text-slate-400">
          via {job.source}
        </span>
      </div>

      {job.extractedSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.extractedSkills.slice(0, 8).map((skill) => (
            <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {skill}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}
