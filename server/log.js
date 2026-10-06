// In-memory server log buffer (not persistent), mirrored to the terminal
// console and the /logs page.
const MAX_ENTRIES = 500
const entries = []

export function log(msg) {
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
  entries.push({ time, msg: String(msg) })
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES)
  console.log(`[rat] ${msg}`)
}

export function getLogs() {
  return entries
}
