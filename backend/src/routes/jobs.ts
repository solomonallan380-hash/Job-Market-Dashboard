import { Router } from "express";
import { fetchRemoteOkJobs } from "../sources/remoteok.js";
import { fetchTheMuseJobs } from "../sources/themuse.js";
import { fetchAdzunaJobs } from "../sources/adzuna.js";
import { enrichJobs } from "../enrichment/claude.js";
import { computeMatchScore } from "../scoring/matchScore.js";
import { buildJobId, jobStore } from "../cache/jobStore.js";
import { isAdzunaConfigured, isClaudeConfigured } from "../config.js";
import { filterRelevantJobs } from "../filters/relevanceFilter.js";
import { fixJobTextEncoding } from "../utils/textEncoding.js";
import { inferWorkMode } from "../enrichment/workMode.js";
import type { EnrichedJob, IntegrationStatus, RawJob } from "../types.js";

export const jobsRouter = Router();

jobsRouter.get("/status", (_req, res) => {
  const status: IntegrationStatus = {
    remoteok: true,
    themuse: true,
    adzuna: isAdzunaConfigured,
    claude: isClaudeConfigured,
  };
  res.json({ ...status, lastRefreshed: jobStore.getLastRefreshed() });
});

jobsRouter.get("/jobs", (req, res) => {
  const skillsParam = typeof req.query.skills === "string" ? req.query.skills : "";
  const userSkills = skillsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const jobs = jobStore.getAll().map((job) => ({
    ...job,
    matchScore: computeMatchScore(userSkills, job.extractedSkills),
  }));

  res.json({
    jobs,
    lastRefreshed: jobStore.getLastRefreshed(),
    total: jobs.length,
  });
});

jobsRouter.post("/jobs/refresh", async (_req, res) => {
  try {
    const results = await Promise.allSettled([
      fetchRemoteOkJobs(),
      fetchTheMuseJobs(),
      fetchAdzunaJobs(),
    ]);

    const sourceErrors: string[] = [];
    const rawJobs: RawJob[] = [];

    results.forEach((result, i) => {
      const sourceName = ["remoteok", "themuse", "adzuna"][i];
      if (result.status === "fulfilled") {
        console.log(`[refresh] ${sourceName}: ${result.value.length} raw jobs (pre-filter)`);
        rawJobs.push(...result.value);
      } else {
        console.error(`[refresh] ${sourceName} failed:`, result.reason);
        sourceErrors.push(`${sourceName}: ${(result.reason as Error).message}`);
      }
    });

    // Repair any mojibake in upstream text fields, then drop postings that
    // aren't relevant to a data/analytics job dashboard, before anything
    // is deduplicated, enriched, or stored.
    const cleanedJobs = rawJobs.map(fixJobTextEncoding);
    const relevantJobs = filterRelevantJobs(cleanedJobs);
    console.log(
      `[refresh] ${rawJobs.length} raw jobs total -> ${relevantJobs.length} passed relevance filter`
    );

    const idsBySourceId = new Map<RawJob, string>();
    for (const job of relevantJobs) {
      idsBySourceId.set(job, buildJobId(job.source, job.company, job.title));
    }

    const newJobs = relevantJobs.filter((job) => !jobStore.has(idsBySourceId.get(job)!));

    if (newJobs.length > 0) {
      const newIds = newJobs.map((job) => idsBySourceId.get(job)!);
      const enrichment = await enrichJobs(newJobs, newIds);

      newJobs.forEach((job, i) => {
        const id = newIds[i];
        const enriched = enrichment.get(id);
        const now = new Date().toISOString();

        const enrichedJob: EnrichedJob = {
          ...job,
          id,
          salaryMin: enriched?.salaryMin ?? job.listedSalaryMin,
          salaryMax: enriched?.salaryMax ?? job.listedSalaryMax,
          salaryCurrency: enriched?.salaryCurrency ?? null,
          experienceLevel: enriched?.experienceLevel ?? "unknown",
          experienceReasoning: enriched?.experienceReasoning ?? null,
          extractedSkills: enriched?.extractedSkills ?? [],
          enrichedByClaude: isClaudeConfigured,
          fetchedAt: now,
          workMode: inferWorkMode(job.title, job.description),
        };

        jobStore.upsert(enrichedJob);
      });
    }

    jobStore.markRefreshed();

    res.json({
      fetched: rawJobs.length,
      newJobs: newJobs.length,
      total: jobStore.getAll().length,
      lastRefreshed: jobStore.getLastRefreshed(),
      sourceErrors,
    });
  } catch (error) {
    console.error("Refresh failed:", error);
    res.status(500).json({ error: "Failed to refresh job data" });
  }
});
