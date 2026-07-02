import { Header } from "./components/Header";
import { StatsStrip } from "./components/StatsStrip";
import { FilterPanel } from "./components/FilterPanel";
import { JobList } from "./components/JobList";
import { TopSkillsChart } from "./components/TopSkillsChart";
import { useJobs } from "./hooks/useJobs";

export default function App() {
  const { jobs, filteredJobs, allSkills, status, loading, refreshing, error, filters, setFilters, handleRefresh } =
    useJobs();

  return (
    <div className="min-h-screen">
      <Header status={status} refreshing={refreshing} onRefresh={handleRefresh} />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading jobs…</p>
        ) : (
          <>
            <StatsStrip jobs={jobs} />

            <div className="flex flex-col gap-6 lg:flex-row">
              <FilterPanel filters={filters} setFilters={setFilters} allSkills={allSkills} />

              <div className="flex-1 space-y-6">
                <TopSkillsChart jobs={jobs} />
                <JobList jobs={filteredJobs} filters={filters} setFilters={setFilters} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
