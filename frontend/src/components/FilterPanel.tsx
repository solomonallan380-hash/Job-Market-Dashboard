import type { Filters, RoleType } from "../hooks/useJobs";
import type { ExperienceLevel, WorkMode } from "../types";

interface FilterPanelProps {
  filters: Filters;
  setFilters: (updater: (prev: Filters) => Filters) => void;
  allSkills: string[];
}

const ROLE_TYPES: RoleType[] = ["Engineering", "Data & Analytics", "Design", "Product", "Business", "Other"];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ["entry", "mid", "senior", "unknown"];
const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function FilterPanel({ filters, setFilters, allSkills }: FilterPanelProps) {
  return (
    <aside className="w-full space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:w-72">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Title or company"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Your skills (for match score)
        </label>
        <input
          type="text"
          value={filters.userSkills}
          onChange={(e) => setFilters((prev) => ({ ...prev, userSkills: e.target.value }))}
          placeholder="Python, SQL, React"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role Type</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ROLE_TYPES.map((role) => (
            <button
              key={role}
              onClick={() => setFilters((prev) => ({ ...prev, roleTypes: toggle(prev.roleTypes, role) }))}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                filters.roleTypes.includes(role)
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience Level</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() =>
                setFilters((prev) => ({ ...prev, experienceLevels: toggle(prev.experienceLevels, level) }))
              }
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition ${
                filters.experienceLevels.includes(level)
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work Mode</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {WORK_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setFilters((prev) => ({ ...prev, workModes: toggle(prev.workModes, mode) }))}
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition ${
                filters.workModes.includes(mode)
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Min. Salary: ${filters.minSalary.toLocaleString()}
        </label>
        <input
          type="range"
          min={0}
          max={250000}
          step={5000}
          value={filters.minSalary}
          onChange={(e) => setFilters((prev) => ({ ...prev, minSalary: Number(e.target.value) }))}
          className="mt-2 w-full"
        />
      </div>

      {allSkills.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
          <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {allSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => setFilters((prev) => ({ ...prev, skills: toggle(prev.skills, skill) }))}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  filters.skills.includes(skill)
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
