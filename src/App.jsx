import { useEffect, useMemo, useRef, useState } from 'react'
import FilterPanel from './components/FilterPanel.jsx'
import RepoPanel from './components/RepoPanel.jsx'
import MetricsView from './components/MetricsView.jsx'
import { listRepos, addRepoFromUrl, addRepoFromZip, removeRepo, getAnalysis } from './api.js'
import { emptyFilters } from './data/filter.js'

export default function App() {
  const [repos, setRepos] = useState([])
  const [analyses, setAnalyses] = useState({})
  const [apiError, setApiError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [draft, setDraft] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const loadedAnalyses = useRef(new Set())

  async function refresh() {
    try {
      const list = await listRepos()
      setRepos(list)
      setApiError('')

      const readyIds = list.filter((r) => r.status === 'ready').map((r) => r.id)
      const missing = readyIds.filter((id) => !loadedAnalyses.current.has(id))
      const fetched = await Promise.all(
        missing.map(async (id) => {
          const analysis = await getAnalysis(id)
          loadedAnalyses.current.add(id)
          return [id, analysis]
        })
      )
      setAnalyses((prev) => {
        const next = {}
        for (const id of readyIds) {
          const analysis = fetched.find(([fetchedId]) => fetchedId === id)?.[1] ?? prev[id]
          if (analysis) next[id] = analysis
        }
        return next
      })
    } catch (e) {
      setApiError(e.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const analyzing = repos.some((r) => r.status === 'analyzing')
  useEffect(() => {
    if (!analyzing) return
    const timer = setInterval(refresh, 1500)
    return () => clearInterval(timer)
  }, [analyzing])

  const authors = useMemo(() => {
    const set = new Set()
    for (const analysis of Object.values(analyses)) {
      for (const commit of analysis.commits) set.add(commit.author)
    }
    return [...set].sort()
  }, [analyses])

  function stripRepoId(filters, id) {
    return { ...filters, repoIds: filters.repoIds.filter((rid) => rid !== id) }
  }

  async function handleAddUrl(url) {
    await addRepoFromUrl(url)
    await refresh()
  }

  async function handleAddZip(file) {
    await addRepoFromZip(file)
    await refresh()
  }

  async function handleRemove(id) {
    try {
      await removeRepo(id)
      loadedAnalyses.current.delete(id)
      setDraft((f) => stripRepoId(f, id))
      setApplied((f) => stripRepoId(f, id))
      await refresh()
    } catch (e) {
      setApiError(e.message)
    }
  }

  function resetFilters() {
    setDraft(emptyFilters())
    setApplied(emptyFilters())
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          RAT <span className="app-sub">repo analysis tool</span>
        </div>
        <button
          type="button"
          className={filtersOpen ? 'primary' : ''}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          {filtersOpen ? '[-] filters' : '[+] filters'}
        </button>
      </header>
      <div className="app-body">
        {filtersOpen && (
          <FilterPanel
            repos={repos}
            authors={authors}
            draft={draft}
            onChange={setDraft}
            onApply={() => setApplied({ ...draft })}
            onReset={resetFilters}
          />
        )}
        <main className="main">
          <p className="muted small">
            file metrics are live from the local git analysis; directory / repo / commit-set metrics pending.
          </p>
          {apiError && <p className="error small">error: {apiError}</p>}
          <RepoPanel repos={repos} onAddUrl={handleAddUrl} onAddZip={handleAddZip} onRemove={handleRemove} />
          <MetricsView repos={repos} analyses={analyses} applied={applied} />
        </main>
      </div>
    </div>
  )
}
