import { useState } from 'react'
import FilterPanel from './components/FilterPanel.jsx'
import RepoPanel from './components/RepoPanel.jsx'
import MetricsView from './components/MetricsView.jsx'
import { SAMPLE_REPOS, AUTHORS } from './data/sampleData.js'
import { emptyFilters } from './data/filter.js'

export default function App() {
  const [repos, setRepos] = useState(SAMPLE_REPOS)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [draft, setDraft] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)

  function addRepo(entry) {
    setRepos((rs) => [...rs, { id: `repo-${Date.now()}`, ...entry }])
  }

  function removeRepo(id) {
    setRepos((rs) => rs.filter((r) => r.id !== id))
    const strip = (f) => ({ ...f, repoIds: f.repoIds.filter((rid) => rid !== id) })
    setDraft(strip)
    setApplied(strip)
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
            authors={AUTHORS}
            draft={draft}
            onChange={setDraft}
            onApply={() => setApplied({ ...draft })}
            onReset={resetFilters}
          />
        )}
        <main className="main">
          <p className="muted small">
            frontend shell: add repos, filter the sample data, inspect metrics. analysis backend pending.
          </p>
          <RepoPanel repos={repos} onAdd={addRepo} onRemove={removeRepo} />
          <MetricsView repos={repos} applied={applied} />
        </main>
      </div>
    </div>
  )
}
