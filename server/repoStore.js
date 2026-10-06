import path from 'node:path'
import fsp from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import extract from 'extract-zip'
import { analyzeRepo } from './analyze.js'
import { log } from './log.js'

const execFileAsync = promisify(execFile)

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(rootDir, 'data')
const reposDir = path.join(dataDir, 'repos')
const tmpDir = path.join(dataDir, 'tmp')

// In-memory state; each repo folder on disk holds meta.json + analysis.json
// so the store survives restarts.
const repos = new Map() // id -> meta
const analyses = new Map() // id -> analysis

const repoPath = (id) => path.join(reposDir, id)

export const tmpDirPath = () => tmpDir

export async function init() {
  await fsp.mkdir(reposDir, { recursive: true })
  await fsp.mkdir(tmpDir, { recursive: true })

  const entries = await fsp.readdir(reposDir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const metaFile = path.join(reposDir, entry.name, 'meta.json')
    let meta
    try {
      meta = JSON.parse(await fsp.readFile(metaFile, 'utf8'))
    } catch {
      continue
    }
    const analysisFile = path.join(reposDir, entry.name, 'analysis.json')
    try {
      analyses.set(meta.id, JSON.parse(await fsp.readFile(analysisFile, 'utf8')))
      meta = { ...meta, status: 'ready', error: null }
    } catch {
      if (meta.status === 'analyzing') {
        // A restart interrupted the analysis. Re-run it if the working tree
        // survived, otherwise report the repo as broken.
        const hasGit = await fsp
          .stat(path.join(repoPath(meta.id), 'repo', '.git'))
          .then(() => true, () => false)
        if (hasGit) {
          runAnalysis(meta, async () => {})
        } else {
          meta = { ...meta, status: 'error', error: 'analysis interrupted by restart' }
        }
      }
    }
    repos.set(meta.id, meta)
  }

  log(`loaded ${repos.size} repos from disk`)
}

export function listRepos() {
  return [...repos.values()].map(publicRepo)
}

export function getAnalysis(id) {
  return analyses.get(id) ?? null
}

export async function addRepoFromUrl(url) {
  const id = randomUUID()
  const meta = {
    id,
    name: nameFromUrl(url),
    source: url,
    kind: 'url',
    status: 'analyzing',
    error: null,
    commitCount: null,
    addedAt: new Date().toISOString(),
  }
  await fsp.mkdir(repoPath(id), { recursive: true })
  await writeMeta(meta)
  log(`repo added: ${meta.name} (url: ${url})`)

  runAnalysis(meta, async () => {
    log(`cloning ${url} ...`)
    await execFileAsync('git', ['clone', '--quiet', '--', url, path.join(repoPath(id), 'repo')], {
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
    log(`clone finished: ${meta.name}`)
  })
  return publicRepo(meta)
}

export async function addRepoFromZip(filePath, originalName) {
  const id = randomUUID()
  const meta = {
    id,
    name: originalName.replace(/\.zip$/i, ''),
    source: originalName,
    kind: 'zip',
    status: 'analyzing',
    error: null,
    commitCount: null,
    addedAt: new Date().toISOString(),
  }
  await fsp.mkdir(repoPath(id), { recursive: true })
  await writeMeta(meta)
  log(`repo added: ${meta.name} (zip: ${originalName})`)

  runAnalysis(meta, async () => {
    const staging = path.join(tmpDir, id)
    log(`extracting ${originalName} ...`)
    try {
      await fsp.mkdir(staging, { recursive: true })
      try {
        await extract(filePath, { dir: staging })
      } catch (e) {
        throw new Error(`could not extract zip: ${e.message}`)
      }
      log(`extracted ${originalName}`)
      const gitRoot = await findGitRoot(staging)
      if (!gitRoot) {
        throw new Error('no .git directory found in the archive; file metrics need commit history')
      }
      await fsp.rename(gitRoot, path.join(repoPath(id), 'repo'))
    } finally {
      await fsp.rm(staging, { recursive: true, force: true })
      await fsp.rm(filePath, { force: true })
    }
  })
  return publicRepo(meta)
}

export async function removeRepo(id) {
  if (!repos.has(id)) return false
  const { name } = repos.get(id)
  repos.delete(id)
  analyses.delete(id)
  await fsp.rm(repoPath(id), { recursive: true, force: true })
  log(`repo removed: ${name}`)
  return true
}

async function runAnalysis(meta, prepare) {
  try {
    await prepare()
    log(`analyzing ${meta.name} ...`)
    const analysis = await analyzeRepo(path.join(repoPath(meta.id), 'repo'))
    if (!repos.has(meta.id)) return // repo removed while analyzing
    analyses.set(meta.id, analysis)
    await fsp.writeFile(path.join(repoPath(meta.id), 'analysis.json'), JSON.stringify(analysis))
    await writeMeta({ ...repos.get(meta.id), status: 'ready', error: null, commitCount: analysis.commits.length })
    const fileChanges = analysis.commits.reduce((n, commit) => n + commit.files.length, 0)
    log(`analysis done: ${meta.name} - ${analysis.commits.length} commits, ${fileChanges} file changes`)
  } catch (e) {
    if (!repos.has(meta.id)) return
    log(`error: ${meta.name}: ${String(e.message ?? e)}`)
    await fsp.rm(repoPath(meta.id), { recursive: true, force: true })
    await fsp.mkdir(repoPath(meta.id), { recursive: true })
    await writeMeta({ ...repos.get(meta.id), status: 'error', error: String(e.message ?? e), commitCount: null })
  }
}

async function writeMeta(meta) {
  repos.set(meta.id, meta)
  await fsp.writeFile(path.join(repoPath(meta.id), 'meta.json'), JSON.stringify(meta, null, 2))
}

function publicRepo(meta) {
  const analysis = analyses.get(meta.id)
  return {
    id: meta.id,
    name: meta.name,
    source: meta.source,
    kind: meta.kind,
    status: meta.status,
    error: meta.error ?? null,
    commitCount: analysis ? analysis.commits.length : (meta.commitCount ?? null),
  }
}

function nameFromUrl(url) {
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean).pop()
    if (seg) return seg.replace(/\.git$/, '')
  } catch {
    // not a URL (e.g. a local path or ssh shorthand); fall through
  }
  const base = url.replace(/\/+$/, '').split('/').pop() || 'repo'
  return base.replace(/\.git$/, '')
}

// Zips usually wrap the repo in a top-level folder; find the directory that
// actually contains .git (breadth-first, bounded depth).
async function findGitRoot(base) {
  const queue = [{ dir: base, depth: 0 }]
  while (queue.length > 0) {
    const { dir, depth } = queue.shift()
    let entries
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true })
    } catch {
      continue
    }
    if (entries.some((entry) => entry.name === '.git')) return dir
    if (depth >= 4) continue
    for (const entry of entries) {
      if (entry.isDirectory()) queue.push({ dir: path.join(dir, entry.name), depth: depth + 1 })
    }
  }
  return null
}
