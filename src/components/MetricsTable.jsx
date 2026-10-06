export default function MetricsTable({ columns, rows, emptyMessage = 'no rows match the current filters' }) {
  return (
    <table className="metrics">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="empty">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className={c.num ? 'num' : ''}>{c.value(row)}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
