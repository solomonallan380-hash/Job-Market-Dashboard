import "dotenv/config";

export const PORT = Number(process.env.PORT) || 4000;

export const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "";
export const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "";
export const ADZUNA_COUNTRY = process.env.ADZUNA_COUNTRY || "us";

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export const isAdzunaConfigured = Boolean(ADZUNA_APP_ID && ADZUNA_APP_KEY);
export const isClaudeConfigured = Boolean(ANTHROPIC_API_KEY);
