// Client-side filter matching for metric rows (repo, author, path, commits).

export function emptyFilters() {
  return {
    repoIds: [],
    author: '',
    path: '',
    commitMode: 'all', // all | range | list
    commitFrom: '',
    commitTo: '',
    commitList: '',
  }
}

export function parseCommitList(text) {
  return text.split(/[\s,]+/).filter(Boolean)
}

// A filter only constrains rows carrying the field it targets; rows
// without that field (e.g. directories have no sha) pass through.
export function rowMatches(row, f) {
  if (f.repoIds.length > 0 && !f.repoIds.includes(row.repoId)) return false
  if (f.author && row.author !== undefined && row.author !== f.author) return false
  if (f.path && row.path !== undefined && !row.path.startsWith(f.path)) return false
  if (f.commitMode === 'range') {
    if (f.commitFrom && row.date < f.commitFrom) return false
    if (f.commitTo && row.date > f.commitTo) return false
  }
  if (f.commitMode === 'list') {
    const shas = parseCommitList(f.commitList)
    if (shas.length > 0 && row.sha !== undefined && !shas.some((s) => row.sha.startsWith(s))) return false
  }
  return true
}
