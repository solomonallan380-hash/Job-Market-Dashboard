import type { RawJob } from "../types.js";

const BASE_URL = "https://www.themuse.com/api/public/jobs";

// The Muse's category taxonomy is broad (legal, healthcare, etc.); restrict to
// categories relevant to a tech/business job market dashboard.
const CATEGORIES = [
  "Software Engineering",
  "Data and Analytics",
  "Design and UX",
  "Product Management",
  "Business Operations",
];

interface MuseJob {
  id: number;
  name: string;
  contents?: string;
  publication_date?: string;
  locations?: Array<{ name: string }>;
  levels?: Array<{ name: string; short_name: string }>;
  tags?: Array<{ name: string }>;
  refs?: { landing_page?: string };
  company?: { name?: string };
}

async function fetchCategory(category: string): Promise<MuseJob[]> {
  const url = `${BASE_URL}?page=0&category=${encodeURIComponent(category)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The Muse request failed with status ${response.status}`);
  }
  const data = (await response.json()) as { results?: MuseJob[] };
  return data.results || [];
}

export async function fetchTheMuseJobs(): Promise<RawJob[]> {
  const results = await Promise.all(CATEGORIES.map(fetchCategory));
  const seen = new Set<number>();
  const jobs: RawJob[] = [];

  for (const batch of results) {
    for (const job of batch) {
      if (seen.has(job.id)) continue;
      seen.add(job.id);

      const locationNames = (job.locations || []).map((loc) => loc.name);
      const isRemote = locationNames.some((name) => /remote|flexible/i.test(name));
      const levelHint = job.levels?.[0]?.name || "";
      const tags = (job.tags || []).map((tag) => tag.name).join(" ");

      jobs.push({
        sourceId: String(job.id),
        source: "themuse",
        title: job.name,
        company: job.company?.name || "Unknown",
        location: locationNames.join(", ") || "Not specified",
        remote: isRemote,
        url: job.refs?.landing_page || "https://www.themuse.com",
        description: `${job.name} ${levelHint} ${tags} ${stripHtml(job.contents || "")}`,
        postedAt: job.publication_date || null,
        listedSalaryMin: null,
        listedSalaryMax: null,
      });
    }
  }

  return jobs;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}
