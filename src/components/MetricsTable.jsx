function TreeCell({ row, onToggle }) {
  const indent = { paddingLeft: `${row.__depth * 16}px` }
  if (!row.__expandable) {
    return (
      <span className="tree-cell" style={indent}>
        <span className="tree-gutter" />
        {row.__name}
      </span>
    )
  }
  return (
    <span className="tree-cell" style={indent}>
      <button type="button" className="tree-toggle" onClick={() => onToggle(row.__key)}>
        {row.__expanded ? '[-]' : '[+]'} {row.__name}
      </button>
    </span>
  )
}

// Rows are plain metric objects. Tree tables add __name / __depth / __key /
// __expandable / __expanded (see MetricsView) and pass the tree column as
// { tree: true }; grouping rows simply carry no metric fields, so their
// cells render empty. onToggle(key) flips a node's expansion.
export default function MetricsTable({ columns, rows, emptyMessage = 'no rows match the current filters', onToggle }) {
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
          rows.map((row) => (
            <tr key={row.__key ?? `${row.repoId}\u001f${row.path ?? '/'}`}>
              {columns.map((c) => (
                <td key={c.key} className={c.num ? 'num' : ''}>
                  {c.tree ? <TreeCell row={row} onToggle={onToggle} /> : c.value(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}
