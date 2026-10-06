// Optional bar graph for the repo tab: added / removed per repository,
// scaled to the largest value across the visible rows. Plain HTML bars,
// no chart library, black / gray to stay within the plain styling.

export default function RepoGraph({ rows, repoName }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.added, r.removed]))
  return (
    <div className="chart">
      <div className="chart-legend muted small">
        <span className="chart-swatch added" /> added
        <span className="chart-swatch removed" /> removed
      </div>
      {rows.map((r) => (
        <div className="chart-row" key={r.repoId}>
          <span className="chart-label" title={repoName(r.repoId)}>
            {repoName(r.repoId)}
          </span>
          <span className="chart-bars">
            <span className="chart-bar added" style={{ width: `${(r.added / max) * 100}%` }} />
            <span className="chart-bar removed" style={{ width: `${(r.removed / max) * 100}%` }} />
          </span>
          <span className="chart-values">
            <span>{r.added}</span>
            <span>{r.removed}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
