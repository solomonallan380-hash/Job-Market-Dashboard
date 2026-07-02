import { createHash } from "crypto";
import type { EnrichedJob } from "../types.js";

export function buildJobId(source: string, company: string, title: string): string {
  return createHash("sha1").update(`${source}:${company}:${title}`.toLowerCase()).digest("hex");
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
