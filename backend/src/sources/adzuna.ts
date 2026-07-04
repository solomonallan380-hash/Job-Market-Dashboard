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

interface AdzunaSearchResponse {
  results?: AdzunaJob[];
  count?: number;
}

// Broadened from ["software engineer", "data analyst", "product manager"] -
// "product manager" rarely matches the title-based relevance filter (see
// relevanceFilter.ts) so it mostly burned request quota without adding
// stored jobs. These terms are chosen to actually pass that filter.
const QUERIES = [
  "data analyst",
  "business analyst",
  "data scientist",
  "data engineer",
  "analytics",
  "business intelligence",
  "machine learning engineer",
  "software engineer",
];

const RESULTS_PER_PAGE = 20;

// Adzuna's docs don't publish a fixed page/rate limit for the free/trial tier
// behind their login-gated reference, and there's no key configured in this
// environment to probe it empirically. Rather than hardcode a guessed
// number, each query paginates adaptively: keep requesting pages until a
// page comes back short (last page reached) or errors (rate limit / auth
// issue), capped at MAX_PAGES_PER_QUERY as a safety ceiling. Watch your
// deploy's logs for "[adzuna] page failed" - if that shows up at a
// consistent page number, that's your real per-key limit; lower
// MAX_PAGES_PER_QUERY to stay under it.
const MAX_PAGES_PER_QUERY = 10;

async function fetchQueryPage(query: string, page: number): Promise<AdzunaSearchResponse> {
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
  return (await response.json()) as AdzunaSearchResponse;
}

async function fetchAllPagesForQuery(query: string): Promise<AdzunaJob[]> {
  const collected: AdzunaJob[] = [];

  for (let page = 1; page <= MAX_PAGES_PER_QUERY; page++) {
    let data: AdzunaSearchResponse;
    try {
      data = await fetchQueryPage(query, page);
    } catch (error) {
      console.error(`[adzuna] stopping query="${query}" at page ${page}:`, error);
      break;
    }

    const results = data.results || [];
    collected.push(...results);

    if (results.length < RESULTS_PER_PAGE) break; // last page reached
    if (data.count != null && collected.length >= data.count) break; // covered all matches
  }

  return collected;
}

export async function fetchAdzunaJobs(): Promise<RawJob[]> {
  if (!isAdzunaConfigured) {
    console.warn("[adzuna] skipped: ADZUNA_APP_ID / ADZUNA_APP_KEY not set");
    return [];
  }

  const settled = await Promise.allSettled(QUERIES.map(fetchAllPagesForQuery));

  const seen = new Set<string>();
  const jobs: RawJob[] = [];

  settled.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[adzuna] query="${QUERIES[i]}" failed entirely:`, result.reason);
      return;
    }

    console.log(`[adzuna] query="${QUERIES[i]}": ${result.value.length} raw results`);

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

  console.log(`[adzuna] ${jobs.length} unique raw jobs across ${QUERIES.length} queries`);

  return jobs;
}
