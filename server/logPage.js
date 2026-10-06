// Minimal auto-refreshing log viewer page. Mirrors the in-memory buffer.
export function logPageHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RAT - server logs</title>
<style>
  body {
    margin: 0;
    padding: 10px 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "DejaVu Sans Mono", monospace;
    font-size: 13px;
    line-height: 1.45;
    color: #111;
    background: #fff;
  }
  h1 {
    font-size: 14px;
    margin: 0 0 8px;
  }
  #log div {
    white-space: pre-wrap;
    word-break: break-all;
  }
  #log .t {
    color: #666;
    margin-right: 8px;
  }
</style>
</head>
<body>
<h1>RAT server logs</h1>
<div id="log"></div>
<script>
const logEl = document.getElementById('log')
let lastCount = -1
async function poll() {
  let entries
  try {
    const res = await fetch('/api/logs')
    entries = await res.json()
  } catch {
    return
  }
  logEl.replaceChildren(
    ...entries.map((entry) => {
      const row = document.createElement('div')
      const time = document.createElement('span')
      time.className = 't'
      time.textContent = entry.time
      row.append(time, entry.msg)
      return row
    })
  )
  if (entries.length !== lastCount) {
    lastCount = entries.length
    window.scrollTo(0, document.body.scrollHeight)
  }
}
poll()
setInterval(poll, 1500)
</script>
</body>
</html>
`
}
