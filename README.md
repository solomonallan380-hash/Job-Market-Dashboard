# Job Market Dashboard

A job-board-style dashboard that aggregates listings from RemoteOK, Adzuna, and
The Muse, enriches them with Claude (salary extraction, entry-level
classification, skill extraction), and lets you filter by role type, salary,
experience level, and your own skills to see a match score per job.

## Architecture

```
job-market-dashboard/
├── backend/    Express + TypeScript API (fetching, Claude enrichment, cache)
├── frontend/   React + Tailwind dashboard (Vite)
└── package.json  Root scripts that build/run both as one deployable service
```

The backend fetches jobs from RemoteOK and The Muse (no keys required) and
Adzuna (needs free API credentials). New jobs are enriched once with Claude —
salary range, experience level, and canonical skills — then cached in memory.
Filtering and skill-match scoring happen instantly against that cache; nothing
re-calls Claude while you're just adjusting filters.

## Local development

Requires Node 18+.

1. **Configure the backend**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Fill in what you have — the app runs on RemoteOK + The Muse alone if
   `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` and `ANTHROPIC_API_KEY` are left blank,
   falling back to keyword-based skill tagging instead of Claude.
   - Adzuna: free credentials at https://developer.adzuna.com
   - Anthropic: key at https://console.anthropic.com

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Run both dev servers** (two terminals)
   ```bash
   npm run dev:backend   # http://localhost:4000
   npm run dev:frontend  # http://localhost:5173, proxies /api to the backend
   ```

4. Open http://localhost:5173, click **Refresh Data** to fetch and enrich
   jobs.

## Deploying as a single service (Render)

The root `package.json` builds the frontend into static files and has the
Express backend serve them from the same process — one URL, one service.

1. Push this repo to GitHub.
2. In Render: **New → Web Service**, connect the repo. It picks up
   `render.yaml` automatically (build: `npm run build`, start: `npm run
   start`).
3. Set the environment variables Render prompts for (`ADZUNA_APP_ID`,
   `ADZUNA_APP_KEY`, `ANTHROPIC_API_KEY`) in the dashboard — they're marked
   `sync: false` in `render.yaml` so Render asks for them rather than
   committing secrets.
4. Deploy. Render sets `PORT` automatically; the backend already reads it.

Without Adzuna/Anthropic keys the deployed app still works end-to-end on
RemoteOK + The Muse with keyword-based skills — add the keys later to unlock
more listings and AI scoring.

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/jobs?skills=Python,SQL` | GET | Cached, enriched jobs with a match score per job |
| `/api/jobs/refresh` | POST | Fetch all sources, enrich new jobs with Claude, update cache |
| `/api/status` | GET | Which integrations are configured, last refresh time |

## Notes

- Claude enrichment happens once per job at ingestion, not on every filter
  interaction — editing your skills list re-scores from the cached data
  instantly, no API calls.
- Job data is in-memory only (no database) — restarting the backend clears
  the cache; hit **Refresh Data** again.
