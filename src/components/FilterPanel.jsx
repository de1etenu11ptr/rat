import { useState } from 'react'
import { parseCommitList } from '../data/filter.js'

export default function FilterPanel({
  repos,
  authors,
  rawAuthors,
  aliases,
  draft,
  onChange,
  onApply,
  onReset,
  onMergeAuthors,
  onUnmergeAuthor,
}) {
  const [mergeFrom, setMergeFrom] = useState('')
  const [mergeTo, setMergeTo] = useState('')
  const set = (patch) => onChange({ ...draft, ...patch })
  const aliasEntries = Object.entries(aliases)

  const toggleRepo = (id, checked) => {
    const repoIds = checked
      ? [...draft.repoIds, id]
      : draft.repoIds.filter((r) => r !== id)
    set({ repoIds })
  }

  return (
    <aside className="filters">
      <h2>filters</h2>

      <div className="field">
        <span className="field-label">repositories</span>
        {repos.length === 0 && <div className="muted">none loaded</div>}
        {repos.map((r) => (
          <label key={r.id} className="check">
            <input
              type="checkbox"
              checked={draft.repoIds.includes(r.id)}
              onChange={(e) => toggleRepo(r.id, e.target.checked)}
            />
            {r.name}
          </label>
        ))}
        <div className="muted small">no selection = all repos</div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="filter-author">author</label>
        <select
          id="filter-author"
          value={draft.author}
          onChange={(e) => set({ author: e.target.value })}
        >
          <option value="">(any)</option>
          {authors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <span className="field-label">merge authors</span>
        <label className="subfield">
          from
          <select value={mergeFrom} onChange={(e) => setMergeFrom(e.target.value)}>
            <option value="">(select)</option>
            {rawAuthors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="subfield">
          into
          <select value={mergeTo} onChange={(e) => setMergeTo(e.target.value)}>
            <option value="">(select)</option>
            {rawAuthors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="small"
          disabled={!mergeFrom || !mergeTo || mergeFrom === mergeTo}
          onClick={() => {
            onMergeAuthors(mergeFrom, mergeTo)
            setMergeFrom('')
            setMergeTo('')
          }}
        >
          merge
        </button>
        {aliasEntries.length > 0 && (
          <div className="indent">
            {aliasEntries.map(([from, to]) => (
              <div key={from} className="merge-entry">
                <span className="small">{from} → {to}</span>
                <button type="button" className="small" onClick={() => onUnmergeAuthor(from)}>
                  x
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="muted small">a repository .mailmap is applied automatically; merge here when it has none</div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="filter-path">file / directory</label>
        <input
          id="filter-path"
          type="text"
          placeholder="src/ or src/App.jsx"
          value={draft.path}
          onChange={(e) => set({ path: e.target.value })}
        />
      </div>

      <div className="field">
        <span className="field-label">commits</span>

        <label className="check">
          <input
            type="radio"
            name="commit-mode"
            checked={draft.commitMode === 'all'}
            onChange={() => set({ commitMode: 'all' })}
          />
          all
        </label>

        <label className="check">
          <input
            type="radio"
            name="commit-mode"
            checked={draft.commitMode === 'range'}
            onChange={() => set({ commitMode: 'range' })}
          />
          date range
        </label>
        {draft.commitMode === 'range' && (
          <div className="indent">
            <label className="subfield">
              from
              <input
                type="date"
                value={draft.commitFrom}
                onChange={(e) => set({ commitFrom: e.target.value })}
              />
            </label>
            <label className="subfield">
              to
              <input
                type="date"
                value={draft.commitTo}
                onChange={(e) => set({ commitTo: e.target.value })}
              />
            </label>
          </div>
        )}

        <label className="check">
          <input
            type="radio"
            name="commit-mode"
            checked={draft.commitMode === 'list'}
            onChange={() => set({ commitMode: 'list' })}
          />
          commit list
        </label>
        {draft.commitMode === 'list' && (
          <div className="indent">
            <textarea
              rows={4}
              placeholder="9f3c2ab, 4d81e77"
              value={draft.commitList}
              onChange={(e) => set({ commitList: e.target.value })}
            />
            <div className="muted small">
              one sha per line ({parseCommitList(draft.commitList).length} entered)
            </div>
          </div>
        )}
      </div>

      <div className="filters-actions">
        <button type="button" className="primary" onClick={onApply}>apply</button>
        <button type="button" onClick={onReset}>reset</button>
      </div>

      <div className="muted small">preview: filters run client-side on the sample data</div>
    </aside>
  )
}
