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

// Adzuna paginates ~20 results per page; a single page per query was
// capping this source at ~60 raw jobs total. Pull the first 5 pages per
// query (up to 100 per query, ~300 total pre-dedup/pre-filter).
const PAGES_PER_QUERY = 5;
const RESULTS_PER_PAGE = 20;

async function fetchQueryPage(query: string, page: number): Promise<AdzunaJob[]> {
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    what: query,
    results_per_page: String(RESULTS_PER_PAGE),
    "content-type": "application/json",
  });
  const url = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/${page}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Adzuna request failed with status ${response.status} (query="${query}", page=${page})`
    );
  }
  const data = (await response.json()) as { results?: AdzunaJob[] };
  return data.results || [];
}

export async function fetchAdzunaJobs(): Promise<RawJob[]> {
  if (!isAdzunaConfigured) {
    console.warn("[adzuna] skipped: ADZUNA_APP_ID / ADZUNA_APP_KEY not set");
    return [];
  }

  const pageRequests: Array<{ query: string; page: number; promise: Promise<AdzunaJob[]> }> = [];
  for (const query of QUERIES) {
    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      pageRequests.push({ query, page, promise: fetchQueryPage(query, page) });
    }
  }

  const settled = await Promise.allSettled(pageRequests.map((r) => r.promise));

  const seen = new Set<string>();
  const jobs: RawJob[] = [];
  let failedPages = 0;

  settled.forEach((result, i) => {
    if (result.status === "rejected") {
      failedPages++;
      console.error(
        `[adzuna] page failed (query="${pageRequests[i].query}", page=${pageRequests[i].page}):`,
        result.reason
      );
      return;
    }

    for (const job of result.value) {
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
  });

  console.log(
    `[adzuna] ${jobs.length} unique raw jobs from ${pageRequests.length} page requests ` +
      `(${QUERIES.length} queries x ${PAGES_PER_QUERY} pages), ${failedPages} page(s) failed`
  );

  return jobs;
}
