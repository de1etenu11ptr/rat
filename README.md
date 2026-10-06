# Repo Analysis Tool (RAT)

A dashboard for measuring file, directory, repo and commit-set metrics across
multiple repositories. Metric definitions live in [AGENTS.md](AGENTS.md).

Current state: **frontend shell only**. Repositories can be added by URL or
zip, the collapsible filter panel narrows down a small sample dataset
client-side, and the metrics views render sample tables. The analysis backend
is not implemented yet, so all numbers shown are placeholder data.

## Requirements

- Node.js 18+ and npm

## Run locally

    npm install
    npm run dev

The dev server prints the URL to open (default http://localhost:5173).

To produce and serve a production build:

    npm run build
    npm run preview

## Layout

- `index.html` - Vite entry
- `src/main.jsx` - React bootstrap
- `src/App.jsx` - layout and app state
- `src/components/FilterPanel.jsx` - collapsible filter panel (repo, author, file/directory, commits)
- `src/components/RepoPanel.jsx` - add/list/remove repositories
- `src/components/MetricsView.jsx` - metric tabs (file, directory, repo, commit set)
- `src/components/MetricsTable.jsx` - table renderer
- `src/data/sampleData.js` - placeholder dataset
- `src/data/filter.js` - client-side filter matching
- `src/styles.css` - styling
