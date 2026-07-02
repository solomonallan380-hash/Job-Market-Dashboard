import { ADZUNA_APP_ID, ADZUNA_APP_KEY, ADZUNA_COUNTRY, isAdzunaConfigured } from "../config.js";
import type { RawJob } from "../types.js";

interface AdzunaJob {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url?: string;
  created?: string;
  salary_min?: number;
  salary_max?: number;
}

// Search a few common tech/business role queries since Adzuna requires a
// keyword rather than offering a browsable category feed like The Muse.
const QUERIES = ["software engineer", "data analyst", "product manager"];

async function fetchQuery(query: string): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    what: query,
    results_per_page: "20",
    "content-type": "application/json",
  });
  const url = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/1?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Adzuna request failed with status ${response.status}`);
  }
  const data = (await response.json()) as { results?: AdzunaJob[] };
  return data.results || [];
}

export async function fetchAdzunaJobs(): Promise<RawJob[]> {
  if (!isAdzunaConfigured) {
    return [];
  }

  const results = await Promise.all(QUERIES.map(fetchQuery));
  const seen = new Set<string>();
  const jobs: RawJob[] = [];

  for (const batch of results) {
    for (const job of batch) {
      if (seen.has(job.id)) continue;
      seen.add(job.id);

      jobs.push({
        sourceId: job.id,
        source: "adzuna",
        title: job.title,
        company: job.company?.display_name || "Unknown",
        location: job.location?.display_name || "Not specified",
        remote: /remote/i.test(job.location?.display_name || "") || /remote/i.test(job.title),
        url: job.redirect_url || "https://www.adzuna.com",
        description: `${job.title} ${job.description || ""}`,
        postedAt: job.created || null,
        listedSalaryMin: job.salary_min || null,
        listedSalaryMax: job.salary_max || null,
      });
    }
  }

  return jobs;
}
