import re
import sys
import requests
import pandas as pd

URL = "https://remoteok.com/api"
HEADERS = {"User-Agent": "Mozilla/5.0"}

SKILL_KEYWORDS = [
    "Python", "SQL", "Excel", "Power BI", "Tableau", "Pandas",
    "R", "Machine Learning", "AI", "Analytics", "Data Analysis",
    "Statistics", "Dashboard", "Looker", "BigQuery", "Snowflake",
    "AWS", "Azure", "ETL", "Data Visualization", "Business Intelligence"
]

DATA_KEYWORDS = ["data", "analyst", "analytics", "business intelligence", "bi"]


def build_skill_pattern(skill: str) -> re.Pattern:
    """Word-boundary regex so short skills like 'R' and 'AI' don't match substrings."""
    return re.compile(rf"\b{re.escape(skill)}\b", re.IGNORECASE)


SKILL_PATTERNS = {skill: build_skill_pattern(skill) for skill in SKILL_KEYWORDS}


def fetch_jobs():
    try:
        response = requests.get(URL, headers=HEADERS, timeout=15)
        response.raise_for_status()
        data = response.json()
    except (requests.RequestException, ValueError) as e:
        print(f"Error fetching jobs from RemoteOK: {e}")
        sys.exit(1)

    if not isinstance(data, list) or len(data) < 2:
        print("Unexpected API response format. No jobs fetched.")
        sys.exit(1)

    jobs = []

    for job in data[1:]:
        title = job.get("position", "")
        company = job.get("company", "")
        tags = job.get("tags", []) or []
        description = job.get("description", "") or ""
        location = job.get("location", "") or "Remote"

        salary_min = job.get("salary_min") or 0
        salary_max = job.get("salary_max") or 0
        salary = max(salary_min, salary_max)

        combined_text = f"{title} {' '.join(tags)} {description}".lower()

        if not any(word in combined_text for word in DATA_KEYWORDS):
            continue

        matched_skills = [
            skill for skill, pattern in SKILL_PATTERNS.items()
            if pattern.search(combined_text)
        ]

        if not matched_skills:
            matched_skills = ["Data Analysis"]

        jobs.append({
            "title": title,
            "company": company,
            "location": location if location else "Remote",
            "remote": "Yes",
            "salary": salary,
            "skills": ", ".join(matched_skills)
        })

    df = pd.DataFrame(jobs)

    if df.empty:
        print("No jobs found.")
        return

    df = df.drop_duplicates(subset=["title", "company"])
    df.to_csv("jobs.csv", index=False)
    print(f"Saved {len(df)} jobs to jobs.csv")


if __name__ == "__main__":
    fetch_jobs()
