import { useState } from 'react'

export default function RepoPanel({ repos, onAddUrl, onAddZip, onRemove }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submitUrl() {
    const trimmed = url.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError('')
    try {
      await onAddUrl(trimmed)
      setUrl('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitZip(e) {
    const file = e.target.files[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      await onAddZip(file)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  function statusText(r) {
    if (r.status === 'ready') return `${r.commitCount} commits`
    if (r.status === 'error') return `error: ${r.error}`
    return r.status
  }

  return (
    <section className="panel">
      <h2>repositories</h2>
      <div className="row">
        <input
          type="text"
          placeholder="https://github.com/user/repo.git (or a local path)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitUrl()}
          disabled={busy}
        />
        <button type="button" onClick={submitUrl} disabled={busy}>add url</button>
        <label className={busy ? 'file-button disabled' : 'file-button'}>
          add zip
          <input type="file" accept=".zip" onChange={submitZip} disabled={busy} />
        </label>
      </div>
      {error && <p className="error small">error: {error}</p>}
      <table className="metrics">
        <thead>
          <tr>
            <th>repo</th>
            <th>source</th>
            <th>type</th>
            <th>status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {repos.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty">
                no repositories — add one above (zip archives must contain .git history)
              </td>
            </tr>
          ) : (
            repos.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="source">{r.source}</td>
                <td>{r.kind}</td>
                <td className={r.status === 'error' ? 'status error' : 'status'}>{statusText(r)}</td>
                <td>
                  <button type="button" className="small" onClick={() => onRemove(r.id)}>
                    remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  )
}
