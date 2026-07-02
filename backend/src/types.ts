export type JobSource = "remoteok" | "adzuna" | "themuse";

export type ExperienceLevel = "entry" | "mid" | "senior" | "unknown";

export interface RawJob {
  sourceId: string;
  source: JobSource;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  url: string;
  description: string;
  postedAt: string | null;
  listedSalaryMin: number | null;
  listedSalaryMax: number | null;
}

export interface EnrichedJob extends RawJob {
  id: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  experienceLevel: ExperienceLevel;
  experienceReasoning: string | null;
  extractedSkills: string[];
  enrichedByClaude: boolean;
  fetchedAt: string;
}

export interface IntegrationStatus {
  remoteok: boolean;
  themuse: boolean;
  adzuna: boolean;
  claude: boolean;
}
