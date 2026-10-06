# Repo Analysis Tool (RAT)

A dashboard for measuring file, directory, repo and commit-set metrics across
multiple repositories. Metric definitions live in [AGENTS.md](AGENTS.md).

All four metric families are implemented, computed for real. Repos are added by
URL or zip, a local analysis server clones/unpacks them, walks the commit
history (`git log --numstat`, one pass), and records the added/removed lines of
every file change between a commit and its previous commit. The frontend then
aggregates those changes over the selected commit set:

- per file: added, removed, growth = added - removed, churn = added + removed
- per directory, summed over everything below it; a file renamed between
  directories counts for both the source and the target directory chain
- per repo: the directory metrics on the root of the commit tree
- per commit set H: the same line totals plus modifications (the number of
  commits with at least one line-changing row in the object), modification
  frequency = modifications / H and churn rate = churn / H, at file, directory
  or repository scope

A commit set H is the set of non-merge commits matching the repo/author/commit
filters. Rows without line changes (pure renames and the like) are kept in the
tables but never count as a modification.

The file, directory and commit-set tables render as collapsible trees: one
node per repository, directories in between and files at the leaves, toggled
with `[+]` / `[-]`. In the file view (and the commit-set per-file scope) the
directory rows are pure grouping — they carry no stats until a file below them
is expanded; the directory views keep each directory's subtree totals on its
own row, collapsed or not. Commit-set calcs are computed lazily, only for the
objects that actually become visible, and cached in a Map, so expanding,
collapsing and switching tabs does not recompute anything.

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

## Authors

Commit authors are identified as `Name <email>`, read with git's mailmap-aware
`%aN`/`%aE`, so a repository `.mailmap` is applied automatically. For
repositories without a mailmap the filter panel can merge authors manually:
pick the identity to fold in and the identity to keep. The mapping is stored in
the browser (localStorage) and applied on top of every analysis.

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
- `server/analyze.js` - git history walk -> per-commit file line changes (authors, merge flag)
- `server/log.js` - in-memory rolling log buffer
- `server/logPage.js` - minimal auto-refreshing `/logs` viewer page
- `index.html`, `src/main.jsx` - Vite/React entry
- `src/App.jsx` - layout and app state (repos, analyses, filters, author aliases)
- `src/api.js` - API client
- `src/components/FilterPanel.jsx` - collapsible filter sidebar, incl. author merging
- `src/components/RepoPanel.jsx` - add/list/remove repositories
- `src/components/MetricsView.jsx` - metric tabs (file / directory / repo / commit set), collapsible per-repo trees
- `src/metrics/fileMetrics.js` - change rows -> file metric aggregation
- `src/metrics/directoryMetrics.js` - change rows -> directory subtree aggregation
- `src/metrics/repoMetrics.js` - change rows -> repo root totals
- `src/metrics/commitSetMetrics.js` - change rows -> commit-set metrics over H; lazy cached calculator for the tables
- `src/data/tree.js` - collapsible path trees (repo -> directories -> leaves) for the metric tables
- `src/data/authors.js` - author identity resolution and manual merging
- `src/data/filter.js` - client-side filter matching
- `src/styles.css` - styling
