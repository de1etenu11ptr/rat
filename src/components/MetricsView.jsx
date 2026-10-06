import { useMemo, useState } from 'react'
import MetricsTable from './MetricsTable.jsx'
import { buildChangeRows, aggregateFileMetrics } from '../metrics/fileMetrics.js'
import { aggregateDirectoryMetrics } from '../metrics/directoryMetrics.js'
import { rowMatches } from '../data/filter.js'

const TABS = [
  { id: 'file', label: 'file', note: 'added / removed / growth / churn per file, aggregated over the selected commits' },
  { id: 'dir', label: 'directory', note: 'added / removed / growth / churn per directory, summed over all files below it' },
  { id: 'repo', label: 'repo', note: 'not implemented yet' },
  { id: 'commits', label: 'commit set', note: 'not implemented yet' },
]

function metricColumns(repoName, pathLabel) {
  const num = (key, label, value) => ({ key, label, num: true, value })
  return [
    { key: 'repo', label: 'repo', value: (r) => repoName(r.repoId) },
    { key: 'path', label: pathLabel, value: (r) => r.path },
    num('added', 'added', (r) => r.added),
    num('removed', 'removed', (r) => r.removed),
    num('growth', 'growth', (r) => r.growth),
    num('churn', 'churn', (r) => r.churn),
  ]
}

export default function MetricsView({ repos, analyses, applied }) {
  const [tab, setTab] = useState('file')

  const changeRows = useMemo(() => buildChangeRows(repos, analyses), [repos, analyses])

  const rows = useMemo(() => {
    const filtered = changeRows.filter((row) => rowMatches(row, applied))
    if (tab === 'file') return aggregateFileMetrics(filtered)
    if (tab === 'dir') return aggregateDirectoryMetrics(filtered)
    return []
  }, [tab, changeRows, applied])

  const repoName = (id) => repos.find((r) => r.id === id)?.name ?? id
  const active = TABS.find((t) => t.id === tab)

  const analyzing = repos.some((r) => r.status === 'analyzing')
  const emptyMessage =
    repos.length === 0
      ? 'no repositories loaded — add one above'
      : analyzing
        ? 'analysis in progress...'
        : repos.some((r) => r.status === 'ready')
          ? 'no rows match the current filters'
          : 'no analyzed repositories — see the status column above'

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
      </div>
      <div className="tab-note muted small">{active.note}</div>
      {tab === 'file' || tab === 'dir' ? (
        <MetricsTable
          columns={metricColumns(repoName, tab === 'file' ? 'file' : 'directory')}
          rows={rows}
          emptyMessage={emptyMessage}
        />
      ) : (
        <p className="muted small">
          {active.label} metrics are not implemented yet — they will reuse the file-metrics change rows.
        </p>
      )}
    </section>
  )
}
