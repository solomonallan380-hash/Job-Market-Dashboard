import type { RawJob } from "../types.js";

// RemoteOK, The Muse, and Adzuna all return postings well outside the scope
// of a data/analytics job market dashboard (e.g. "Pedagogy Specialist
// English", "Supply Chain Director"). A posting is kept if its title or
// description contains at least one of these keywords. Tune this list to
// broaden or narrow what gets surfaced.
export const RELEVANCE_KEYWORDS = [
  "data",
  "analyst",
  "analytics",
  "python",
  "sql",
  "bi",
  "business intelligence",
  "data scientist",
  "data science",
  "data engineer",
  "data engineering",
  "machine learning",
  "ai",
  "artificial intelligence",
  "etl",
  "big data",
  "tableau",
  "power bi",
  "looker",
  "warehouse",
  "pandas",
  "spark",
  "statistics",
  "statistician",
  "quantitative",
  "database",
  "dashboard",
  "visualization",
  "scientist",
  "engineer",
];

function buildKeywordPattern(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

const KEYWORD_PATTERNS = RELEVANCE_KEYWORDS.map(buildKeywordPattern);

// Matches against the title only. Matching against `description` was tried
// and measured against live RemoteOK/The Muse data: RemoteOK's `tags` field
// turned out to be a generic site-wide career-category taxonomy (not
// job-specific skills) that tags nearly everything "engineer", and long-form
// descriptions mention words like "data" in unrelated boilerplate (privacy
// policy text, etc). In a live sample, description-based matching let ~108
// clearly irrelevant postings ("Supply Chain Director", "Chief Financial
// Officer", "Custodian", ...) through, while title-only matching produced a
// clean, sane result set. Titles are short and deliberate, so this keyword
// list is a reliable signal there.
export function isRelevantJob(job: Pick<RawJob, "title" | "description">): boolean {
  return KEYWORD_PATTERNS.some((pattern) => pattern.test(job.title));
}

export function filterRelevantJobs(jobs: RawJob[]): RawJob[] {
  return jobs.filter(isRelevantJob);
}
