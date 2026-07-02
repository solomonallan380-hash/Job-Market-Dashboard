import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, isClaudeConfigured } from "../config.js";
import type { ExperienceLevel, RawJob } from "../types.js";
import { matchSkillsByKeyword } from "../skillKeywords.js";

// Override with ANTHROPIC_MODEL if you want a cheaper model for bulk enrichment.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const BATCH_SIZE = 8;

const client = isClaudeConfigured ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

export interface ClaudeEnrichment {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  experienceLevel: ExperienceLevel;
  experienceReasoning: string | null;
  extractedSkills: string[];
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          salaryMin: { type: ["integer", "null"] },
          salaryMax: { type: ["integer", "null"] },
          salaryCurrency: { type: ["string", "null"] },
          experienceLevel: {
            type: "string",
            enum: ["entry", "mid", "senior", "unknown"],
          },
          experienceReasoning: { type: ["string", "null"] },
          extractedSkills: { type: "array", items: { type: "string" } },
        },
        required: [
          "id",
          "salaryMin",
          "salaryMax",
          "salaryCurrency",
          "experienceLevel",
          "experienceReasoning",
          "extractedSkills",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
};

const EXPERIENCE_RULES: Array<[ExperienceLevel, RegExp]> = [
  [
    "entry",
    /\b(entry[- ]level|junior|jr\.?|intern(ship)?|new grad(uate)?|associate|trainee|apprentice)\b/i,
  ],
  [
    "senior",
    /\b(senior|sr\.?|lead|principal|staff|director|head of|architect|vp|chief)\b/i,
  ],
  ["mid", /\b(mid[- ]level|mid[- ]senior|intermediate)\b/i],
];

function inferExperienceLevel(title: string, description: string): ExperienceLevel {
  const text = `${title} ${description}`;
  for (const [level, pattern] of EXPERIENCE_RULES) {
    if (pattern.test(text)) return level;
  }
  return "unknown";
}

function keywordFallback(job: RawJob): ClaudeEnrichment {
  const hasListedSalary = Boolean(job.listedSalaryMin || job.listedSalaryMax);
  return {
    salaryMin: job.listedSalaryMin,
    salaryMax: job.listedSalaryMax,
    salaryCurrency: hasListedSalary ? "USD" : null,
    experienceLevel: inferExperienceLevel(job.title, job.description),
    experienceReasoning: null,
    extractedSkills: matchSkillsByKeyword(job.description),
  };
}

async function enrichBatch(
  jobs: RawJob[],
  ids: string[]
): Promise<Map<string, ClaudeEnrichment>> {
  const results = new Map<string, ClaudeEnrichment>();

  if (!client) {
    jobs.forEach((job, i) => results.set(ids[i], keywordFallback(job)));
    return results;
  }

  const jobList = jobs
    .map(
      (job, i) =>
        `[${ids[i]}] ${job.title} at ${job.company}\n${job.description.slice(0, 1500)}`
    )
    .join("\n\n---\n\n");

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      output_config: { format: { type: "json_schema", schema: RESPONSE_SCHEMA } },
      messages: [
        {
          role: "user",
          content:
            "For each job posting below, extract: a normalized salary range " +
            '(salaryMin/salaryMax as integers in the listed currency, salaryCurrency as ' +
            "an ISO code, or null for all three if no salary is mentioned anywhere in the " +
            'text), an experienceLevel classification ("entry", "mid", "senior", or ' +
            '"unknown" if unclear) with a one-sentence experienceReasoning, and ' +
            "extractedSkills (a canonical list of technical/professional skills, tools, " +
            'and technologies mentioned or clearly implied — normalize casing, e.g. ' +
            '"Python" not "python"). Echo back the bracketed id exactly for each job.\n\n' +
            `Jobs:\n\n${jobList}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in Claude response");
    }

    const parsed = JSON.parse(textBlock.text) as {
      results: Array<ClaudeEnrichment & { id: string }>;
    };

    for (const item of parsed.results) {
      results.set(item.id, {
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        salaryCurrency: item.salaryCurrency,
        experienceLevel: item.experienceLevel,
        experienceReasoning: item.experienceReasoning,
        extractedSkills: item.extractedSkills,
      });
    }
  } catch (error) {
    console.error("Claude enrichment batch failed, using keyword fallback:", error);
  }

  jobs.forEach((job, i) => {
    if (!results.has(ids[i])) {
      results.set(ids[i], keywordFallback(job));
    }
  });

  return results;
}

export async function enrichJobs(
  jobs: RawJob[],
  ids: string[]
): Promise<Map<string, ClaudeEnrichment>> {
  const merged = new Map<string, ClaudeEnrichment>();

  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batchJobs = jobs.slice(i, i + BATCH_SIZE);
    const batchIds = ids.slice(i, i + BATCH_SIZE);
    const batchResults = await enrichBatch(batchJobs, batchIds);
    for (const [key, value] of batchResults) {
      merged.set(key, value);
    }
  }

  return merged;
}
