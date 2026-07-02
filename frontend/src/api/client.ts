import type { IntegrationStatus, JobsResponse, RefreshResponse } from "../types";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchJobs(skills: string[]): Promise<JobsResponse> {
  const params = skills.length > 0 ? `?skills=${encodeURIComponent(skills.join(","))}` : "";
  return request<JobsResponse>(`/api/jobs${params}`);
}

export function fetchStatus(): Promise<IntegrationStatus> {
  return request<IntegrationStatus>("/api/status");
}

export async function refreshJobs(): Promise<RefreshResponse> {
  const response = await fetch("/api/jobs/refresh", { method: "POST" });
  if (!response.ok) {
    throw new Error(`Refresh failed with status ${response.status}`);
  }
  return response.json() as Promise<RefreshResponse>;
}
