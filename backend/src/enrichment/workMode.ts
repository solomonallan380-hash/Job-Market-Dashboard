import type { WorkMode } from "../types.js";

// Most source APIs don't label remote/hybrid/onsite explicitly, so this is
// inferred once from the title/description text at fetch time and cached on
// the job record rather than recomputed on every filter interaction.
export function inferWorkMode(title: string, description: string): WorkMode {
  const text = `${title} ${description}`;
  if (/\bremote\b|\bwork from home\b/i.test(text)) return "remote";
  if (/\bhybrid\b/i.test(text)) return "hybrid";
  return "onsite";
}
