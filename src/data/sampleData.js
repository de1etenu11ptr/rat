// Placeholder dataset for the UI shell.
// Replaced by real analysis results once the backend exists.

export const SAMPLE_REPOS = [
  { id: 'r1', name: 'rat-web', source: 'https://github.com/example/rat-web.git', kind: 'url' },
  { id: 'r2', name: 'parser', source: 'parser-main.zip', kind: 'zip' },
]

export const AUTHORS = ['alice', 'bob', 'carol']

export const FILE_ROWS = [
  { repoId: 'r1', path: 'src/App.jsx', author: 'alice', date: '2026-09-14', added: 120, removed: 40 },
  { repoId: 'r1', path: 'src/components/FilterPanel.jsx', author: 'alice', date: '2026-09-16', added: 90, removed: 10 },
  { repoId: 'r1', path: 'src/styles.css', author: 'bob', date: '2026-09-18', added: 60, removed: 12 },
  { repoId: 'r1', path: 'README.md', author: 'alice', date: '2026-09-12', added: 25, removed: 0 },
  { repoId: 'r1', path: 'server/index.js', author: 'bob', date: '2026-09-20', added: 140, removed: 30 },
  { repoId: 'r1', path: 'package.json', author: 'carol', date: '2026-09-10', added: 8, removed: 3 },
  { repoId: 'r2', path: 'src/lexer.py', author: 'carol', date: '2026-09-05', added: 200, removed: 45 },
  { repoId: 'r2', path: 'src/parser.py', author: 'carol', date: '2026-09-07', added: 150, removed: 20 },
  { repoId: 'r2', path: 'tests/test_lexer.py', author: 'bob', date: '2026-09-09', added: 80, removed: 5 },
  { repoId: 'r2', path: 'README.md', author: 'bob', date: '2026-09-03', added: 15, removed: 2 },
]

export const DIR_ROWS = [
  { repoId: 'r1', path: 'src/', author: 'alice', date: '2026-09-16', added: 270, removed: 62 },
  { repoId: 'r1', path: 'src/components/', author: 'alice', date: '2026-09-16', added: 90, removed: 10 },
  { repoId: 'r1', path: 'server/', author: 'bob', date: '2026-09-20', added: 140, removed: 30 },
  { repoId: 'r2', path: 'src/', author: 'carol', date: '2026-09-07', added: 350, removed: 65 },
  { repoId: 'r2', path: 'tests/', author: 'bob', date: '2026-09-09', added: 80, removed: 5 },
]

export const COMMIT_ROWS = [
  { repoId: 'r1', sha: '9f3c2ab', author: 'alice', date: '2026-09-14', files: 3, added: 120, removed: 40 },
  { repoId: 'r1', sha: 'a02b9c1', author: 'alice', date: '2026-09-16', files: 1, added: 90, removed: 10 },
  { repoId: 'r1', sha: '4d81e77', author: 'bob', date: '2026-09-18', files: 1, added: 60, removed: 12 },
  { repoId: 'r1', sha: '77ce013', author: 'bob', date: '2026-09-20', files: 2, added: 140, removed: 30 },
  { repoId: 'r1', sha: '12ab890', author: 'carol', date: '2026-09-10', files: 1, added: 8, removed: 3 },
  { repoId: 'r2', sha: 'c3d7e12', author: 'carol', date: '2026-09-05', files: 2, added: 200, removed: 45 },
  { repoId: 'r2', sha: 'e59a204', author: 'carol', date: '2026-09-07', files: 1, added: 150, removed: 20 },
  { repoId: 'r2', sha: '88f0b3d', author: 'bob', date: '2026-09-09', files: 2, added: 80, removed: 5 },
  { repoId: 'r2', sha: '0af4c56', author: 'bob', date: '2026-09-03', files: 1, added: 15, removed: 2 },
]
