import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJobs, fetchStatus, refreshJobs } from "../api/client";
import type { ExperienceLevel, IntegrationStatus, Job } from "../types";

export type RoleType = "Engineering" | "Data & Analytics" | "Design" | "Product" | "Business" | "Other";

const ROLE_RULES: Array<[RoleType, RegExp]> = [
  ["Engineering", /engineer|developer|swe|programmer|architect/i],
  ["Data & Analytics", /data|analyst|analytics|scientist|machine learning|\bai\b/i],
  ["Design", /design|ux|ui\b/i],
  ["Product", /product manager|product owner|\bpm\b/i],
  ["Business", /marketing|sales|operations|finance|hr\b|recruiter/i],
];

export function classifyRole(title: string): RoleType {
  for (const [role, pattern] of ROLE_RULES) {
    if (pattern.test(title)) return role;
  }
  return "Other";
}

export interface Filters {
  search: string;
  roleTypes: RoleType[];
  experienceLevels: ExperienceLevel[];
  minSalary: number;
  skills: string[];
  userSkills: string;
  sortBy: "match" | "salary" | "recent";
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  roleTypes: [],
  experienceLevels: [],
  minSalary: 0,
  skills: [],
  userSkills: "",
  sortBy: "recent",
};

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const loadJobs = useCallback(async (userSkillsInput: string) => {
    setError(null);
    try {
      const skills = userSkillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const [jobsRes, statusRes] = await Promise.all([fetchJobs(skills), fetchStatus()]);
      setJobs(jobsRes.jobs);
      setStatus(statusRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs(filters.userSkills);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadJobs(filters.userSkills);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.userSkills]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshJobs();
      await loadJobs(filters.userSkills);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [filters.userSkills, loadJobs]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((job) => job.extractedSkills.forEach((skill) => set.add(skill)));
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((job) => {
      if (filters.search) {
        const haystack = `${job.title} ${job.company}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      if (filters.roleTypes.length > 0 && !filters.roleTypes.includes(classifyRole(job.title))) {
        return false;
      }
      if (filters.experienceLevels.length > 0 && !filters.experienceLevels.includes(job.experienceLevel)) {
        return false;
      }
      const salary = job.salaryMax ?? job.salaryMin ?? 0;
      if (filters.minSalary > 0 && salary > 0 && salary < filters.minSalary) return false;
      if (
        filters.skills.length > 0 &&
        !filters.skills.every((skill) => job.extractedSkills.includes(skill))
      ) {
        return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      if (filters.sortBy === "match") return (b.matchScore ?? -1) - (a.matchScore ?? -1);
      if (filters.sortBy === "salary") return (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0);
      return (b.postedAt ? Date.parse(b.postedAt) : 0) - (a.postedAt ? Date.parse(a.postedAt) : 0);
    });

    return result;
  }, [jobs, filters]);

  return {
    jobs,
    filteredJobs,
    allSkills,
    status,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    handleRefresh,
  };
}
