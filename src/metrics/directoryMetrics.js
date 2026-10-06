// Directory metrics.
//
// A directory's metrics aggregate the changes of every file below it: its
// immediate files plus, recursively, everything under its immediate
// subdirectories — i.e. the subtree total of the selected change rows.
//
// Membership follows the spec: a file f counts for directory d if f is an
// immediate child of d in h or h(p). Applied to change rows this means a row
// counts for every ancestor directory of its path, and — for renames — also
// for every ancestor of its source path (oldPath), so a file moved between
// directories contributes to both directory chains.
//
//   growth = added - removed
//   churn  = added + removed
//
// The repository root is not listed: root-level files belong to no non-root
// directory, and the whole-repo totals will be provided by repo metrics.

export function directoryChain(filePath) {
  const parts = filePath.split('/')
  const chain = []
  let dir = ''
  for (let i = 0; i < parts.length - 1; i++) {
    dir = dir ? `${dir}/${parts[i]}` : parts[i]
    chain.push(dir)
  }
  return chain
}

export function aggregateDirectoryMetrics(rows) {
  const byDir = new Map()
  for (const row of rows) {
    const dirs = new Set(directoryChain(row.path))
    if (row.oldPath) {
      for (const dir of directoryChain(row.oldPath)) dirs.add(dir)
    }
    for (const dir of dirs) {
      const key = `${row.repoId}\u001f${dir}`
      let agg = byDir.get(key)
      if (!agg) {
        agg = { repoId: row.repoId, path: dir, added: 0, removed: 0 }
        byDir.set(key, agg)
      }
      agg.added += row.added
      agg.removed += row.removed
    }
  }
  return [...byDir.values()].map(({ repoId, path, added, removed }) => ({
    repoId,
    path,
    added,
    removed,
    growth: added - removed,
    churn: added + removed,
  }))
}
