import { useCallback, useMemo, useState } from 'react'
import MetricsTable from './MetricsTable.jsx'
import { buildChangeRows, aggregateFileMetrics } from '../metrics/fileMetrics.js'
import { aggregateDirectoryMetrics } from '../metrics/directoryMetrics.js'
import { aggregateRepoMetrics } from '../metrics/repoMetrics.js'
import { countCommitsInSelection, createCommitSetCalculator } from '../metrics/commitSetMetrics.js'
import { rowMatches } from '../data/filter.js'
import { buildDirTree, buildFileTree, flattenTree } from '../data/tree.js'

const TABS = [
  {
    id: 'file',
    label: 'file',
    note: 'added / removed / growth / churn per file, aggregated over the selected commits — collapsible by directory ([+] / [-]); collapsed directory rows carry no stats',
  },
  {
    id: 'dir',
    label: 'directory',
    note: 'added / removed / growth / churn per directory, summed over all files below it — collapsible; a directory row keeps its subtree totals while collapsed (repo roots show repo totals)',
  },
  {
    id: 'repo',
    label: 'repo',
    note: 'added / removed / growth / churn per repository — directory metrics at the root of the commit tree',
  },
  {
    id: 'commits',
    label: 'commit set',
    note: 'over the selected commit set H (merge commits excluded): line totals, modifications (commits changing lines in the row), frequency = modifications / H, churn rate = churn / H — calcs are cached per object and computed lazily as rows become visible',
  },
]

const COMMIT_SCOPES = [
  { id: 'file', label: 'per file' },
  { id: 'dir', label: 'per directory' },
  { id: 'repo', label: 'per repository' },
]

function numColumn(key, label) {
  return { key, label, num: true, value: (r) => (r[key] == null ? '' : r[key]) }
}

function treeColumn() {
  return { key: 'path', label: 'path', tree: true }
}

function repoColumn(repoName) {
  return { key: 'repo', label: 'repo', value: (r) => repoName(r.repoId) }
}

function lineColumns() {
  return [
    numColumn('added', 'added'),
    numColumn('removed', 'removed'),
    numColumn('growth', 'growth'),
    numColumn('churn', 'churn'),
  ]
}

function commitColumns() {
  return [
    numColumn('modifications', 'modifications'),
    {
      key: 'frequency',
      label: 'frequency',
      num: true,
      value: (r) => (r.frequency == null ? '' : `${(r.frequency * 100).toFixed(1)}%`),
    },
    {
      key: 'churnRate',
      label: 'churn rate',
      num: true,
      value: (r) => (r.churnRate == null ? '' : r.churnRate.toFixed(1)),
    },
  ]
}

export default function MetricsView({ repos, analyses, applied }) {
  const [tab, setTab] = useState('file')
  const [commitScope, setCommitScope] = useState('file')
  const [expanded, setExpanded] = useState(() => new Set())

  const changeRows = useMemo(() => buildChangeRows(repos, analyses), [repos, analyses])
  const filtered = useMemo(() => changeRows.filter((row) => rowMatches(row, applied)), [changeRows, applied])
  const commitCounts = useMemo(() => countCommitsInSelection(repos, analyses, applied), [repos, analyses, applied])

  // Commit-set calcs are lazy and cached in a Map: a scope index is built on
  // first use, an object's metrics are computed the first time one of its
  // rows becomes visible, and results are reused until the filtered rows
  // change (which replaces this calculator).
  const commitCalc = useMemo(() => createCommitSetCalculator(filtered, commitCounts), [filtered, commitCounts])

  const repoName = (id) => repos.find((r) => r.id === id)?.name ?? id
  const active = TABS.find((t) => t.id === tab)

  const toggle = useCallback((key) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // What the active tab shows: a flat row list (repo scopes) or tree items
  // (file / directory tabs and the commit-set file / directory scopes) plus
  // the function that supplies a node's stats once it is visible.
  const view = useMemo(() => {
    if (tab === 'file') {
      return { mode: 'tree', leaf: 'file', items: aggregateFileMetrics(filtered), stats: (node) => node.row }
    }
    if (tab === 'dir') {
      return {
        mode: 'tree',
        leaf: 'dir',
        items: aggregateDirectoryMetrics(filtered),
        rootStats: aggregateRepoMetrics(filtered),
        stats: (node) => node.row,
      }
    }
    if (tab === 'repo') {
      return { mode: 'flat', rows: aggregateRepoMetrics(filtered) }
    }
    if (commitScope === 'file') {
      return {
        mode: 'tree',
        leaf: 'file',
        items: commitCalc.files(),
        stats: (node) => (node.kind === 'file' ? commitCalc.get('file', node.repoId, node.path) : null),
      }
    }
    if (commitScope === 'dir') {
      return {
        mode: 'tree',
        leaf: 'dir',
        items: commitCalc.dirs(),
        stats: (node) => commitCalc.get(node.kind === 'repo' ? 'repo' : 'dir', node.repoId, node.path),
      }
    }
    return { mode: 'flat', rows: commitCalc.repos().map((repoId) => commitCalc.get('repo', repoId)) }
  }, [tab, commitScope, filtered, commitCalc])

  const trees = useMemo(() => {
    if (view.mode !== 'tree') return null
    return view.leaf === 'dir'
      ? buildDirTree(repos, view.items, view.rootStats)
      : buildFileTree(repos, view.items)
  }, [view, repos])

  // Flattened rows for the current expansion. Stats are pulled per visible
  // node only — the commit-set calculator memoizes them in its Map.
  const displayRows = useMemo(() => {
    if (!trees) return view.rows
    return flattenTree(trees, expanded).map(({ node, depth }) => ({
      ...(view.stats(node) ?? {}),
      __key: node.key,
      __name: node.name,
      __depth: depth,
      __expandable: node.children.length > 0,
      __expanded: expanded.has(node.key),
    }))
  }, [trees, view, expanded])

  let columns
  if (tab === 'repo') {
    columns = [repoColumn(repoName), ...lineColumns()]
  } else if (tab === 'commits') {
    const head = commitScope === 'repo' ? repoColumn(repoName) : treeColumn()
    columns = [head, ...lineColumns(), ...commitColumns()]
  } else {
    columns = [treeColumn(), ...lineColumns()]
  }

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
      <MetricsTable
        columns={columns}
        rows={displayRows}
        emptyMessage={emptyMessage}
        onToggle={view.mode === 'tree' ? toggle : undefined}
      />
    </section>
  )
}
