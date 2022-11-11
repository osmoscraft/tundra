# Layered architecture V2

## Layers

- Binary
  - Unit of storage
  - Requirement: Durabibility, redundancy
  - Implementations: file system, SQL database
- Object
  - Unit of cross-network synchronization
  - Requirement: Consistency, Performance, Distributed
  - Synchronization: GitHub/GitLab API, S3 compatible API + Worker, Browser HTTP client
  - Implementations: Git Database, R2, Backblaze
- Tree
  - Unit of knowledge
  - Requirement: Lists and links, semantic content
  - Implementations: Markdown, Haiku, HTML

## Active exploration

- Binary: abstracted by R2
- Object: R2 in remote, Indexed DB in browser
- Tree: TBD
