import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import multer from 'multer'
import * as store from './repoStore.js'
import { log, getLogs } from './log.js'
import { logPageHtml } from './logPage.js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

await store.init()

const app = express()
app.use(express.json())

app.get('/api/repos', (req, res) => {
  res.json(store.listRepos())
})

app.post('/api/repos', async (req, res) => {
  try {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : ''
    if (!url) return res.status(400).json({ error: 'field "url" is required' })
    const repo = await store.addRepoFromUrl(url)
    res.status(201).json(repo)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const upload = multer({ dest: store.tmpDirPath(), limits: { fileSize: 512 * 1024 * 1024 } })

app.post('/api/repos/zip', upload.single('zip'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'zip file is required in field "zip"' })
    const repo = await store.addRepoFromZip(req.file.path, req.file.originalname)
    res.status(201).json(repo)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/repos/:id/analysis', (req, res) => {
  const analysis = store.getAnalysis(req.params.id)
  if (!analysis) return res.status(404).json({ error: 'analysis not available' })
  res.json(analysis)
})

app.delete('/api/repos/:id', async (req, res) => {
  try {
    const removed = await store.removeRepo(req.params.id)
    if (!removed) return res.status(404).json({ error: 'repo not found' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/logs', (req, res) => {
  res.json(getLogs())
})

app.get('/logs', (req, res) => {
  res.type('html').send(logPageHtml())
})

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not found' })
})

// Serve the built frontend when it exists (npm run build && npm start).
const distDir = path.join(rootDir, 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

const port = Number(process.env.PORT) || 3001
app.listen(port, () => {
  log(`api listening on http://localhost:${port}`)
})
