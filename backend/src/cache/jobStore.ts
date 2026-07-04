import { createHash } from "crypto";
import type { EnrichedJob, RawJob } from "../types.js";

export function buildJobId(source: string, company: string, title: string): string {
  return createHash("sha1").update(`${source}:${company}:${title}`.toLowerCase()).digest("hex");
}

// buildJobId's hash includes `source`, so the same role crossposted to
// multiple boards (e.g. RemoteOK and Adzuna) gets a different id on each and
// wouldn't otherwise be caught by the jobStore's id-based upsert. Collapse
// those before storage, independent of which source(s) they came from.
export function dedupeAcrossSources(jobs: RawJob[]): RawJob[] {
  const seen = new Set<string>();
  const deduped: RawJob[] = [];

  for (const job of jobs) {
    const key = `${job.company.trim().toLowerCase()}|${job.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(job);
  }

  return deduped;
}

class JobStore {
  private jobs = new Map<string, EnrichedJob>();
  private lastRefreshed: string | null = null;

  getAll(): EnrichedJob[] {
    return Array.from(this.jobs.values());
  }

  get(id: string): EnrichedJob | undefined {
    return this.jobs.get(id);
  }

  has(id: string): boolean {
    return this.jobs.has(id);
  }

  upsert(job: EnrichedJob): void {
    this.jobs.set(job.id, job);
  }

  markRefreshed(): void {
    this.lastRefreshed = new Date().toISOString();
  }

  getLastRefreshed(): string | null {
    return this.lastRefreshed;
  }
}

export const jobStore = new JobStore();
