import { useMemo, useState } from 'react'
import MetricsTable from './MetricsTable.jsx'
import { buildChangeRows, aggregateFileMetrics } from '../metrics/fileMetrics.js'
import { aggregateDirectoryMetrics } from '../metrics/directoryMetrics.js'
import { aggregateRepoMetrics } from '../metrics/repoMetrics.js'
import { countCommitsInSelection, aggregateCommitSetMetrics } from '../metrics/commitSetMetrics.js'
import { rowMatches } from '../data/filter.js'

const TABS = [
  { id: 'file', label: 'file', note: 'added / removed / growth / churn per file, aggregated over the selected commits' },
  { id: 'dir', label: 'directory', note: 'added / removed / growth / churn per directory, summed over all files below it' },
  { id: 'repo', label: 'repo', note: 'added / removed / growth / churn per repository — directory metrics at the root of the commit tree' },
  { id: 'commits', label: 'commit set', note: 'over the selected commit set H (merge commits excluded): line totals, modifications (commits changing lines in the row), frequency = modifications / H, churn rate = churn / H' },
]

const COMMIT_SCOPES = [
  { id: 'file', label: 'per file' },
  { id: 'dir', label: 'per directory' },
  { id: 'repo', label: 'per repository' },
]

const SCOPE_PATH_LABELS = { file: 'file', dir: 'directory', repo: 'repository' }

function numColumn(key, label, value) {
  return { key, label, num: true, value }
}

function metricColumns(repoName, pathLabel) {
  return [
    { key: 'repo', label: 'repo', value: (r) => repoName(r.repoId) },
    { key: 'path', label: pathLabel, value: (r) => r.path },
    numColumn('added', 'added', (r) => r.added),
    numColumn('removed', 'removed', (r) => r.removed),
    numColumn('growth', 'growth', (r) => r.growth),
    numColumn('churn', 'churn', (r) => r.churn),
  ]
}

function repoColumns(repoName) {
  return metricColumns(repoName).filter((c) => c.key !== 'path')
}

function commitSetColumns(repoName, pathLabel) {
  return [
    ...metricColumns(repoName, pathLabel),
    numColumn('modifications', 'modifications', (r) => r.modifications),
    numColumn('frequency', 'frequency', (r) => `${(r.frequency * 100).toFixed(1)}%`),
    numColumn('churnRate', 'churn rate', (r) => r.churnRate.toFixed(1)),
  ]
}

export default function MetricsView({ repos, analyses, applied }) {
  const [tab, setTab] = useState('file')
  const [commitScope, setCommitScope] = useState('file')

  const changeRows = useMemo(() => buildChangeRows(repos, analyses), [repos, analyses])

  const rows = useMemo(() => {
    const filtered = changeRows.filter((row) => rowMatches(row, applied))
    if (tab === 'file') return aggregateFileMetrics(filtered)
    if (tab === 'dir') return aggregateDirectoryMetrics(filtered)
    if (tab === 'repo') return aggregateRepoMetrics(filtered)
    if (tab === 'commits') {
      const commitCounts = countCommitsInSelection(repos, analyses, applied)
      return aggregateCommitSetMetrics(filtered, commitScope, commitCounts)
    }
    return []
  }, [tab, commitScope, changeRows, repos, analyses, applied])

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
      {tab === 'commits' && (
        <div className="tabs">
          {COMMIT_SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={s.id === commitScope ? 'tab active' : 'tab'}
              onClick={() => setCommitScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      {tab === 'file' && (
        <MetricsTable columns={metricColumns(repoName, 'file')} rows={rows} emptyMessage={emptyMessage} />
      )}
      {tab === 'dir' && (
        <MetricsTable columns={metricColumns(repoName, 'directory')} rows={rows} emptyMessage={emptyMessage} />
      )}
      {tab === 'repo' && (
        <MetricsTable columns={repoColumns(repoName)} rows={rows} emptyMessage={emptyMessage} />
      )}
      {tab === 'commits' && (
        <MetricsTable
          columns={commitSetColumns(repoName, SCOPE_PATH_LABELS[commitScope])}
          rows={rows}
          emptyMessage={emptyMessage}
        />
      )}
    </section>
  )
}
