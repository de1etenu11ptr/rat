// File metrics.
//
// A change row is the line change of one file in one commit:
// "file f added/removed lines between commit h and its previous commit h(p)".
// These rows are the shared primitive the later directory, repo and
// commit-set metrics should reuse. oldPath carries the source path of a
// rename (null otherwise); directory metrics attribute the row to it as well.
//
// File metrics aggregate change rows per file over the selected commits:
//   growth = added - removed
//   churn  = added + removed

export function buildChangeRows(repos, analyses) {
  const rows = []
  for (const repo of repos) {
    const analysis = analyses[repo.id]
    if (!analysis) continue
    for (const commit of analysis.commits) {
      for (const file of commit.files) {
        rows.push({
          repoId: repo.id,
          sha: commit.sha,
          author: commit.author,
          date: commit.date,
          path: file.path,
          oldPath: file.oldPath ?? null,
          added: file.added,
          removed: file.removed,
        })
      }
    }
  }
  return rows
}

export function aggregateFileMetrics(rows) {
  const byFile = new Map()
  for (const row of rows) {
    const key = `${row.repoId}\u001f${row.path}`
    let agg = byFile.get(key)
    if (!agg) {
      agg = { repoId: row.repoId, path: row.path, added: 0, removed: 0 }
      byFile.set(key, agg)
    }
    agg.added += row.added
    agg.removed += row.removed
  }
  return [...byFile.values()].map(({ repoId, path, added, removed }) => ({
    repoId,
    path,
    added,
    removed,
    growth: added - removed,
    churn: added + removed,
  }))
}
