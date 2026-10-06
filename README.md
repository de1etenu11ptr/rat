# Repo Analysis Tool (RAT)

A dashboard for measuring file, directory, repo and commit-set metrics across
multiple repositories. Metric definitions live in [AGENTS.md](AGENTS.md).

Implemented so far: **file and directory metrics**, computed for real. Repos are
added by URL or zip, a local analysis server clones/unpacks them, walks the
commit history (`git log --numstat`, one pass), and records the added/removed
lines of every file change between a commit and its previous commit. The
frontend then aggregates those changes over the selected commit set:

- per file: added, removed, growth = added - removed, churn = added + removed
- per directory, summed over everything below it; a file renamed between
  directories counts for both the source and the target directory chain

Repo and commit-set metrics are not implemented yet; they will reuse the same
per-commit file change rows.

## Requirements

- Node.js 18+ and npm
- `git` on PATH (the analysis shells out to git)

## Run locally

    npm install
    npm run dev

`npm run dev` starts both the Vite dev server (http://localhost:5173) and the
analysis API (http://localhost:3001); the frontend proxies `/api` to it.

Production build, served by the same Node server:

    npm run build
    npm start

## Adding repositories

- **URL**: anything `git clone` accepts (https URL or a local path).
- **Zip**: the archive must contain a `.git` directory (GitHub
  "Download ZIP" archives have no history and are rejected).
  Archives with the repo wrapped in a top-level folder work fine.

Repos are cloned/extracted under `data/` (gitignored) together with an
`analysis.json` per repo, so they survive server restarts. A tiny fixture repo
for trying things out is created by `bash data/fixtures/make-fixture.sh`.

## Server logs

The analysis server keeps an in-memory rolling log (last 500 entries, not
persisted across restarts) of what it is doing: repo added, cloning,
extracting, analyzing, analysis done, errors, repo removed.

- Log page (auto-refreshes): http://localhost:3001/logs
- Raw JSON: http://localhost:3001/api/logs

The same lines are printed to the terminal running the server, prefixed
with `[rat]`.

## Layout

- `server/index.js` - Express API: list/add/remove repos, serve analysis
- `server/repoStore.js` - repo lifecycle: clone, zip extraction, persistence
- `server/analyze.js` - git history walk -> per-commit file line changes
- `server/log.js` - in-memory rolling log buffer
- `server/logPage.js` - minimal auto-refreshing `/logs` viewer page
- `index.html`, `src/main.jsx` - Vite/React entry
- `src/App.jsx` - layout and app state (repos, analyses, filters)
- `src/api.js` - API client
- `src/components/FilterPanel.jsx` - collapsible filter sidebar
- `src/components/RepoPanel.jsx` - add/list/remove repositories
- `src/components/MetricsView.jsx` - metric tabs (file/directory implemented, rest pending)
- `src/metrics/fileMetrics.js` - change rows -> file metric aggregation
- `src/metrics/directoryMetrics.js` - change rows -> directory subtree aggregation
- `src/data/filter.js` - client-side filter matching
- `src/styles.css` - styling
