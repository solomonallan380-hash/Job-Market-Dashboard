import type { RawJob } from "../types.js";

const URL = "https://remoteok.com/api";
const HEADERS = { "User-Agent": "Mozilla/5.0" };

interface RemoteOkJob {
  id?: string;
  slug?: string;
  position?: string;
  company?: string;
  tags?: string[];
  description?: string;
  location?: string;
  url?: string;
  apply_url?: string;
  date?: string;
  salary_min?: number;
  salary_max?: number;
}

export async function fetchRemoteOkJobs(): Promise<RawJob[]> {
  const response = await fetch(URL, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`RemoteOK request failed with status ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error("RemoteOK returned an unexpected response shape");
  }

  return (data.slice(1) as RemoteOkJob[])
    .filter((job) => job.position && job.company)
    .map((job) => {
      const salaryMin = job.salary_min || 0;
      const salaryMax = job.salary_max || 0;
      const tags = job.tags || [];

      return {
        sourceId: String(job.id ?? job.slug ?? `${job.company}-${job.position}`),
        source: "remoteok",
        title: job.position!,
        company: job.company!,
        location: job.location?.trim() || "Remote",
        remote: true,
        url: job.url || job.apply_url || "https://remoteok.com",
        description: `${(job.position || "")} ${tags.join(" ")} ${job.description || ""}`,
        postedAt: job.date || null,
        listedSalaryMin: salaryMin > 0 ? salaryMin : null,
        listedSalaryMax: salaryMax > 0 ? salaryMax : null,
      } satisfies RawJob;
    });
}
