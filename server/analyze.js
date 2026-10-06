import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// Walks the whole history in one pass. For every commit we record the line
// changes of each file versus its previous commit (h -> h(p)), taken from
// `git log --numstat`, the author as "Name <email>" (via %aN/%aE, so a
// repository .mailmap is applied) and a merge flag derived from the parents
// listed by %p. Merge commits produce no file changes with the default log
// behavior; binary files ('-') are skipped, they have no line counts. Pure
// renames / mode changes (0/0) are kept as rows: they introduce the file
// entry at its new path but never count as modifications.
export async function analyzeRepo(repoDir) {
  const { stdout } = await execFileAsync(
    'git',
    [
      '-C', repoDir,
      '-c', 'core.quotepath=false',
      'log',
      '--no-color',
      '-M',
      '--numstat',
      '--pretty=format:\x1e%H\x1f%aN\x1f%aE\x1f%aI\x1f%p',
    ],
    { maxBuffer: 256 * 1024 * 1024 }
  )

  const commits = []
  for (const chunk of stdout.split('\x1e')) {
    if (!chunk.trim()) continue
    const lines = chunk.split('\n')
    const [sha, name, email, date, parents] = lines[0].split('\x1f')
    const files = []
    for (const line of lines.slice(1)) {
      if (!line) continue
      const [added, removed, ...pathParts] = line.split('\t')
      if (pathParts.length === 0) continue
      if (added === '-' || removed === '-') continue
      const { path, oldPath } = resolveRename(pathParts.join('\t'))
      const file = { path, added: Number(added), removed: Number(removed) }
      if (oldPath) file.oldPath = oldPath
      files.push(file)
    }
    const parentList = parents?.trim() ? parents.trim().split(' ') : []
    const commit = { sha, author: `${name} <${email}>`, date, files }
    if (parentList.length > 1) commit.merge = true
    commits.push(commit)
  }

  return { generatedAt: new Date().toISOString(), commits }
}

// -M numstat reports renames as "old => new" or "prefix{old => new}suffix".
// File metrics track the file under its path at commit h (the new path);
// oldPath (only set for renames) is kept because directory metrics count a
// file for a directory it was an immediate child of in h or h(p).
// Rebuilding a path from the brace form can double a slash when one side is
// empty ("tests/{ => inputs}/t" -> "tests//t"); git paths never contain
// doubled slashes, so collapse them.
function resolveRename(rawPath) {
  const brace = rawPath.match(/^(.*)\{(.*?) => (.*?)\}(.*)$/)
  if (brace) {
    return {
      path: joinBrace(brace[1], brace[3], brace[4]),
      oldPath: joinBrace(brace[1], brace[2], brace[4]),
    }
  }
  const arrow = rawPath.indexOf(' => ')
  if (arrow !== -1) {
    return { path: rawPath.slice(arrow + 4), oldPath: rawPath.slice(0, arrow) }
  }
  return { path: rawPath, oldPath: null }
}

function joinBrace(prefix, middle, suffix) {
  return (prefix + middle + suffix).replace(/\/{2,}/g, '/')
}
