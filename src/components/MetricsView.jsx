import { useMemo, useState } from 'react'
import MetricsTable from './MetricsTable.jsx'
import { FILE_ROWS, DIR_ROWS, COMMIT_ROWS } from '../data/sampleData.js'
import { rowMatches } from '../data/filter.js'

const TABS = [
  { id: 'file', label: 'file', note: 'added / removed / growth / churn per file' },
  { id: 'dir', label: 'directory', note: 'line counts aggregated per directory' },
  { id: 'repo', label: 'repo', note: 'totals per repository over the selected commits' },
  { id: 'commits', label: 'commit set', note: 'totals per commit over the selected commit set' },
]

function columnsFor(tab, repoName) {
  const growth = (r) => r.added - r.removed
  const churn = (r) => r.added + r.removed
  const num = (key, label, value) => ({ key, label, num: true, value })
  const repoCol = { key: 'repo', label: 'repo', value: (r) => repoName(r.repoId) }

  switch (tab) {
    case 'file':
      return [
        repoCol,
        { key: 'path', label: 'file', value: (r) => r.path },
        num('added', 'added', (r) => r.added),
        num('removed', 'removed', (r) => r.removed),
        num('growth', 'growth', growth),
        num('churn', 'churn', churn),
      ]
    case 'dir':
      return [
        repoCol,
        { key: 'path', label: 'directory', value: (r) => r.path },
        num('added', 'added', (r) => r.added),
        num('removed', 'removed', (r) => r.removed),
        num('growth', 'growth', growth),
        num('churn', 'churn', churn),
      ]
    case 'repo':
      return [
        { key: 'repo', label: 'repo', value: (r) => r.name },
        num('commits', 'commits', (r) => r.commits),
        num('added', 'added', (r) => r.added),
        num('removed', 'removed', (r) => r.removed),
        num('growth', 'growth', growth),
        num('churn', 'churn', churn),
      ]
    case 'commits':
      return [
        repoCol,
        { key: 'sha', label: 'commit', value: (r) => r.sha },
        { key: 'author', label: 'author', value: (r) => r.author },
        { key: 'date', label: 'date', value: (r) => r.date },
        num('files', 'files', (r) => r.files),
        num('added', 'added', (r) => r.added),
        num('removed', 'removed', (r) => r.removed),
        num('growth', 'growth', growth),
        num('churn', 'churn', churn),
      ]
    default:
      return []
  }
}

export default function MetricsView({ repos, applied }) {
  const [tab, setTab] = useState('file')

  const rows = useMemo(() => {
    const repoName = (id) => repos.find((r) => r.id === id)?.name ?? id
    const filter = (list) => list.filter((r) => rowMatches(r, applied))

    switch (tab) {
      case 'file':
        return filter(FILE_ROWS)
      case 'dir':
        return filter(DIR_ROWS)
      case 'commits':
        return filter(COMMIT_ROWS)
      case 'repo': {
        const byRepo = new Map()
        for (const c of filter(COMMIT_ROWS)) {
          const agg = byRepo.get(c.repoId) ?? { repoId: c.repoId, commits: 0, added: 0, removed: 0 }
          agg.commits += 1
          agg.added += c.added
          agg.removed += c.removed
          byRepo.set(c.repoId, agg)
        }
        return [...byRepo.values()].map((r) => ({ ...r, name: repoName(r.repoId) }))
      }
      default:
        return []
    }
  }, [tab, applied, repos])

  const repoName = (id) => repos.find((r) => r.id === id)?.name ?? id
  const active = TABS.find((t) => t.id === tab)

  return (
    <section className="panel">
      <h2>metrics</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <span className="tabs-note muted small">sample data</span>
      </div>
      <div className="tab-note muted small">{active.note}</div>
      <MetricsTable columns={columnsFor(tab, repoName)} rows={rows} />
    </section>
  )
}
