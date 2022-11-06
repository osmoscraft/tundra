# Alternative Runtime

## Bun

- Cross-platform install via git clone
  - Post clone, create exeutable in bin
- On start
  - Download and installs Bun.js
  - Check git version
  - Chech self update (by compare with upstream master)
- FS: Native OS file system
- Sync: Git
- Graph: Bun built-in SQLite
- FTS: SQLite FTS5 extension
- Hackability:
  - JavaScript/TypeScript for both client and server side plugins
  - SQL query needed for Graph and FTS related extensions
- True dependencies
  - Git
  - Bun
  - SQLite + FTS5
  - TypeScript


## Go

- Prebuilt executable with Network Proxy, File system access, and Git
- Comes with esbuild bundler transpiler
- FS: Native OS file system
- Sync: Go-Git
- Graph: Indexed DB in Browser
- FTS: Flexsearch or Lyra search in Browser
- Hackability
  - JavaScript/TypeScript only
  - Network Proxy, FS, Git, Bundling behavior are locked per runtime version
- True dependencies
  - Go
  - Go Git
  - TypeScript