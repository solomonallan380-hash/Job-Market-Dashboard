import os
import streamlit as st
import pandas as pd
from collections import Counter
import plotly.express as px

st.set_page_config(
    page_title="Job Market Intelligence Dashboard",
    layout="wide"
)

st.title("Job Market Intelligence Dashboard")
st.markdown("""
A market intelligence tool that analyzes job posting data to identify hiring trends,
skill demand, and remote work patterns.

**Use case:** companies, recruiters, and job seekers can use this to understand where demand is moving.
""")

# --- Load data ---
DATA_PATH = "jobs.csv"

if not os.path.exists(DATA_PATH):
    st.error(
        "No `jobs.csv` found. Run `python fetch_jobs.py` first to generate the dataset, "
        "then refresh this page."
    )
    st.stop()

df = pd.read_csv(DATA_PATH)

if df.empty:
    st.warning("`jobs.csv` is empty. Try running `python fetch_jobs.py` again.")
    st.stop()

st.sidebar.title("Dashboard Controls")

st.markdown("## 🔍 Start Here")

search = st.text_input(
    "Search for a skill or job title (Example: SQL, Python, Data Analyst)"
)

st.info("""
1. Enter a skill or job title above  
2. Use filters on the left if needed  
3. Scroll down to see insights and recommendations  
""")

# --- Sidebar filters ---
location_filter = st.sidebar.multiselect(
    "Location",
    options=sorted(df["location"].dropna().unique()),
    default=sorted(df["location"].dropna().unique())
)

remote_filter = st.sidebar.multiselect(
    "Work Type",
    options=sorted(df["remote"].dropna().unique()),
    default=sorted(df["remote"].dropna().unique())
)

skill_options = sorted(set(
    skill.strip()
    for skills in df["skills"].dropna()
    for skill in str(skills).split(",")
    if skill.strip()
))

skill_filter = st.sidebar.multiselect(
    "Skills",
    options=skill_options,
    default=skill_options
)

# --- Apply filters ---
filtered_df = df[
    (df["location"].isin(location_filter)) &
    (df["remote"].isin(remote_filter))
]

if skill_filter:
    filtered_df = filtered_df[
        filtered_df["skills"].apply(
            lambda x: any(skill in str(x) for skill in skill_filter)
        )
    ]

if search:
    filtered_df = filtered_df[
        filtered_df["title"].str.contains(search, case=False, na=False) |
        filtered_df["skills"].str.contains(search, case=False, na=False)
    ]

st.divider()

# --- Executive Summary ---
st.subheader("Executive Summary")

col1, col2, col3, col4 = st.columns(4)

col1.metric("Job Postings", len(filtered_df))
col2.metric("Companies Hiring", filtered_df["company"].nunique())
col3.metric("Remote Roles", len(filtered_df[filtered_df["remote"] == "Yes"]))

salary_jobs = filtered_df[filtered_df["salary"] > 0]
if not salary_jobs.empty:
    col4.metric("Avg. Salary (listed)", f"${salary_jobs['salary'].mean():,.0f}")
else:
    col4.metric("Avg. Salary (listed)", "N/A")

if salary_jobs.empty:
    st.caption("Note: most postings on RemoteOK don't list a salary, so this metric may show N/A.")

# --- Skill Demand Insights ---
st.subheader("Skill Demand Insights")

sql_jobs = filtered_df[filtered_df["skills"].str.contains("SQL", case=False, na=False)]
python_jobs = filtered_df[filtered_df["skills"].str.contains("Python", case=False, na=False)]

sql_percent = (len(sql_jobs) / len(filtered_df)) * 100 if len(filtered_df) > 0 else 0
python_percent = (len(python_jobs) / len(filtered_df)) * 100 if len(filtered_df) > 0 else 0

demand_col1, demand_col2 = st.columns(2)

demand_col1.metric("SQL Demand", f"{sql_percent:.1f}%")
demand_col2.metric("Python Demand", f"{python_percent:.1f}%")

st.divider()

# --- Top Skills + Strategic Insight ---
all_skills = []

for skills in filtered_df["skills"]:
    for skill in str(skills).split(","):
        skill = skill.strip()
        if skill:
            all_skills.append(skill)

skill_counts = Counter(all_skills)
skill_df = pd.DataFrame(skill_counts.items(), columns=["Skill", "Mentions"])
skill_df = skill_df.sort_values(by="Mentions", ascending=False).head(10)

left_col, right_col = st.columns([2, 1])

with left_col:
    st.subheader("Top In-Demand Skills")
    if not skill_df.empty:
        fig = px.bar(
            skill_df,
            x="Mentions",
            y="Skill",
            orientation="h"
        )
        fig.update_layout(yaxis=dict(autorange="reversed"))
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No skill data for the current filters.")

with right_col:
    st.subheader("Strategic Insight")

    if not skill_df.empty:
        top_skill = skill_df.iloc[0]["Skill"]
        top_skill_count = skill_df.iloc[0]["Mentions"]

        st.success(f"Top Skill: {top_skill}")
        st.write(f"**{top_skill}** appears in **{top_skill_count}** job postings.")

        st.info(
            "This helps identify which technical skills are most valuable in the current job market. "
            "Companies can use this for hiring strategy, and job seekers can use it to prioritize what to learn."
        )
    else:
        st.warning("No skill data available for the selected filters.")

st.divider()

# --- Companies Hiring + Job Title Demand ---
colA, colB = st.columns(2)

with colA:
    st.subheader("Companies Hiring")
    company_counts = filtered_df["company"].value_counts().head(10)

    if not company_counts.empty:
        fig = px.bar(
            x=company_counts.values,
            y=company_counts.index,
            orientation="h",
            labels={"x": "Postings", "y": "Company"}
        )
        fig.update_layout(yaxis=dict(autorange="reversed"))
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No company data for the current filters.")

with colB:
    st.subheader("Job Title Demand")
    title_counts = filtered_df["title"].value_counts().head(10)

    if not title_counts.empty:
        fig = px.bar(
            x=title_counts.values,
            y=title_counts.index,
            orientation="h",
            labels={"x": "Postings", "y": "Job Title"}
        )
        fig.update_layout(yaxis=dict(autorange="reversed"))
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No job title data for the current filters.")

st.divider()

# --- Job Posting Explorer ---
st.subheader("Job Posting Explorer")

st.dataframe(
    filtered_df,
    use_container_width=True,
    hide_index=True
)

st.download_button(
    label="Download Filtered Job Data",
    data=filtered_df.to_csv(index=False),
    file_name="filtered_jobs.csv",
    mime="text/csv"
)

st.divider()

# --- Skill Recommendation Engine ---
st.subheader("Skill Recommendation Engine")

user_skill = st.text_input("Enter a skill you know")

if user_skill:
    related_jobs = filtered_df[
        filtered_df["skills"].str.contains(user_skill, case=False, na=False)
    ]

    if not related_jobs.empty:
        all_related_skills = []

        for skills in related_jobs["skills"]:
            for skill in str(skills).split(","):
                skill = skill.strip()
                if skill:
                    all_related_skills.append(skill)

        related_skill_counts = Counter(all_related_skills)

        recommendations = [
            skill for skill, count in related_skill_counts.most_common(6)
            if skill.lower() != user_skill.lower()
        ][:5]

        st.write(f"If you know **{user_skill}**, you should also learn:")

        if recommendations:
            st.success(", ".join(recommendations))
        else:
            st.warning("No additional related skills found.")
    else:
        st.warning("No jobs found that mention this skill.")

st.divider()

st.subheader("Business Value")

st.write("""
This dashboard helps organizations identify hiring demand, skill trends, and market movement.
A company could use this to support workforce planning, recruiting strategy, competitive intelligence,
or training program design.
""")
