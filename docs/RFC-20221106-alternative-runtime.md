# Alternative Runtime

## Bun

- Cross-platform install via git clone
  - Post clone, create exeutable in bin
- On start
  - Download and installs Bun.js
  - Check git version
  - Chech self update (by compare with upstream master)
- FS: Native OS file system
- Sync: Git CLI, if exposed to Bun; libgit2, if CLI not available
- Graph: Bun built-in SQLite
- FTS: SQLite FTS5 extension
- Network: Proxy via Bun.js
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
- Network: Proxy via Go
- Hackability
  - JavaScript/TypeScript only
  - Network Proxy, FS, Git, Bundling behavior are locked per runtime version
- True dependencies
  - Go
  - Go Git
  - TypeScript


## Linux first

- Use modular software for each service
- Find glue to combine then
- Installer: AppImage, or remote shell script
- FS: Native OS file system
- Sync: Git CLI
- Graph: Indexed DB in Browser
- FTS: JavaScript library in Browser
- Network: curl/wget
- Shell: A cross platform HTTP to shell command pipe, in Go lang
- Hackability
  - Modular swapping of Network, Git module
  - JavaScript/TypeScript edit?
- True dependencies
  - Git
  - Browser
  - GNU/Linux basic utils
  - Binary from Go lang
