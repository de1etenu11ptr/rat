import { useState } from 'react'

function nameFromUrl(url) {
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean).pop() ?? u.hostname
    return seg.replace(/\.git$/, '')
  } catch {
    return url
  }
}

export default function RepoPanel({ repos, onAdd, onRemove }) {
  const [url, setUrl] = useState('')

  function addUrl() {
    const trimmed = url.trim()
    if (!trimmed) return
    onAdd({ name: nameFromUrl(trimmed), source: trimmed, kind: 'url' })
    setUrl('')
  }

  function addZip(e) {
    const file = e.target.files[0]
    if (!file) return
    onAdd({ name: file.name.replace(/\.zip$/i, ''), source: file.name, kind: 'zip' })
    e.target.value = ''
  }

  return (
    <section className="panel">
      <h2>repositories</h2>
      <div className="row">
        <input
          type="text"
          placeholder="https://github.com/user/repo.git"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addUrl()}
        />
        <button type="button" onClick={addUrl}>add url</button>
        <label className="file-button">
          add zip
          <input type="file" accept=".zip" onChange={addZip} />
        </label>
      </div>
      <table className="metrics">
        <thead>
          <tr>
            <th>repo</th>
            <th>source</th>
            <th>type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {repos.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">no repositories</td>
            </tr>
          ) : (
            repos.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="source">{r.source}</td>
                <td>{r.kind}</td>
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
