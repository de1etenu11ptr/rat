// Repo metrics.
//
// Repository metrics are directory metrics on the root of the commit tree:
// the totals of every change row of the repository over the selected commits.
// Each row is counted once (renames included, no directory double counting).

export function aggregateRepoMetrics(rows) {
  const byRepo = new Map()
  for (const row of rows) {
    let agg = byRepo.get(row.repoId)
    if (!agg) {
      agg = { repoId: row.repoId, added: 0, removed: 0 }
      byRepo.set(row.repoId, agg)
    }
    agg.added += row.added
    agg.removed += row.removed
  }
  return [...byRepo.values()].map(({ repoId, added, removed }) => ({
    repoId,
    added,
    removed,
    growth: added - removed,
    churn: added + removed,
  }))
}
