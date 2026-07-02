import type { Job } from "../types";
import { JobCard } from "./JobCard";
import type { Filters } from "../hooks/useJobs";

interface JobListProps {
  jobs: Job[];
  filters: Filters;
  setFilters: (updater: (prev: Filters) => Filters) => void;
}

export function JobList({ jobs, filters, setFilters }: JobListProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">{jobs.length} jobs</p>
        <select
          value={filters.sortBy}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, sortBy: e.target.value as Filters["sortBy"] }))
          }
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="recent">Most recent</option>
          <option value="salary">Highest salary</option>
          <option value="match">Best match</option>
        </select>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No jobs match your filters yet. Try refreshing data or loosening filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
