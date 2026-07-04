export type JobSource = "remoteok" | "adzuna" | "themuse";
export type ExperienceLevel = "entry" | "mid" | "senior" | "unknown";
export type WorkMode = "remote" | "hybrid" | "onsite";

export interface Job {
  id: string;
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
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  experienceLevel: ExperienceLevel;
  experienceReasoning: string | null;
  extractedSkills: string[];
  enrichedByClaude: boolean;
  fetchedAt: string;
  matchScore: number | null;
  workMode: WorkMode;
}

export interface JobsResponse {
  jobs: Job[];
  lastRefreshed: string | null;
  total: number;
}

export interface IntegrationStatus {
  remoteok: boolean;
  themuse: boolean;
  adzuna: boolean;
  claude: boolean;
  lastRefreshed: string | null;
}

export interface RefreshResponse {
  fetched: number;
  newJobs: number;
  total: number;
  lastRefreshed: string | null;
  sourceErrors: string[];
}
