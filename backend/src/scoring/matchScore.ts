function normalize(skill: string): string {
  return skill.trim().toLowerCase();
}

export function computeMatchScore(userSkills: string[], jobSkills: string[]): number | null {
  const cleanedUserSkills = userSkills.map(normalize).filter(Boolean);
  if (cleanedUserSkills.length === 0) {
    return null;
  }

  const normalizedJobSkills = new Set(jobSkills.map(normalize));
  const matched = cleanedUserSkills.filter((skill) => normalizedJobSkills.has(skill));

  return Math.round((matched.length / cleanedUserSkills.length) * 100);
}
