// Commit set metrics.
//
// H is the selected commit set: the non-merge commits matching the repo,
// author and commit filters. The path filter narrows which changed files are
// shown, it does not shrink H.
//
// Per file / directory (subtree totals) / repository, over H:
//   added / removed / growth / churn   line totals of the scope's change rows
//   modifications                      commits in H with at least one row in
//                                      the scope that changes lines (a pure
//                                      rename / mode change row does not count)
//   frequency                          modifications / |H|
//   churn rate                         churn / |H|

import { rowMatches } from '../data/filter.js'
import { directoryTargets } from './directoryMetrics.js'

export function countCommitsInSelection(repos, analyses, filters) {
  const counts = new Map()
  for (const repo of repos) {
    const analysis = analyses[repo.id]
    if (!analysis) continue
    let count = 0
    for (const commit of analysis.commits) {
      if (commit.merge === true) continue
      // Commit row without a path: the path filter passes it through, so H
      // is not narrowed by the path filter.
      const row = { repoId: repo.id, sha: commit.sha, author: commit.author, date: commit.date }
      if (rowMatches(row, filters)) count++
    }
    counts.set(repo.id, count)
  }
  return counts
}

export function aggregateCommitSetMetrics(rows, scope, commitCounts) {
  const byKey = new Map()
  for (const row of rows) {
    const targets =
      scope === 'dir' ? directoryTargets(row) : scope === 'repo' ? ['/'] : [row.path]
    for (const target of targets) {
      const key = `${row.repoId}\u001f${target}`
      let agg = byKey.get(key)
      if (!agg) {
        agg = { repoId: row.repoId, path: target, added: 0, removed: 0, shas: new Set() }
        byKey.set(key, agg)
      }
      agg.added += row.added
      agg.removed += row.removed
      if (row.added > 0 || row.removed > 0) agg.shas.add(row.sha)
    }
  }
  return [...byKey.values()].map(({ repoId, path, added, removed, shas }) => {
    const modifications = shas.size
    const commits = commitCounts.get(repoId) ?? 0
    const churn = added + removed
    return {
      repoId,
      path,
      added,
      removed,
      growth: added - removed,
      churn,
      modifications,
      frequency: commits > 0 ? modifications / commits : 0,
      churnRate: commits > 0 ? churn / commits : 0,
    }
  })
}
