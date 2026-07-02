export const SKILL_KEYWORDS = [
  "Python", "SQL", "Excel", "Power BI", "Tableau", "Pandas",
  "R", "Machine Learning", "AI", "Analytics", "Data Analysis",
  "Statistics", "Dashboard", "Looker", "BigQuery", "Snowflake",
  "AWS", "Azure", "GCP", "ETL", "Data Visualization", "Business Intelligence",
  "JavaScript", "TypeScript", "React", "Node.js", "Java", "Go", "Docker",
  "Kubernetes", "Spark", "Kafka", "NoSQL", "MongoDB", "PostgreSQL",
];

function buildSkillPattern(skill: string): RegExp {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

const SKILL_PATTERNS: Array<[string, RegExp]> = SKILL_KEYWORDS.map((skill) => [
  skill,
  buildSkillPattern(skill),
]);

export function matchSkillsByKeyword(text: string): string[] {
  const matches = SKILL_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(
    ([skill]) => skill
  );
  return matches.length > 0 ? matches : [];
}
