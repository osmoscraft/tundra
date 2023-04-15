[Previous](./RFC-20220831-modular-service-architecture.md)

# Business-driven modules

- Local Persistence
  - FS with metadata
  - Agonostic of content
- Graph
  - Content awareness
  - Searchable
  - Reference tracking
- Sync
  - Optional
  - Change tracking
  - Remote sync

## Module infra

- Private SQLite database instance
- Expose events and pre/post write hooks
- Wrapped in worker for rpc
- Source code share, but not runtime share

## Control plane across modules

- Bootstraping modules
- Event storm resolution
