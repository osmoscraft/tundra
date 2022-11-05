# Layered Architecture

- [v2](./RFC-20221104-layered-architecture-v2.md)

## Abstract layers (what)

1. Bytes
2. Files
3. Strings
4. Frame: Header and Body
5. Graph: Node and Edge

## Concrete layers (how)

1. Disk (d)
2. Git (d)
3. Indexed DB
4. JS Heap memeory

(d) - distributed

## Design considerations

1. A layer should be agnostic of lower layers
2. Each "what" layer should be encapsulated by each "how" layer
3. Each layer should fully contain its state; inter-layer communication should be pure functions

## Implementations

- Disk and Git layers are distrubted across the network
- Git layer handles Files and Strings.
  - Content agnostic: just plaintext
  - Metadata agonostic: git does not support metadata tracking
- Git and Indexed DB layers synchronize with [Sync algorithm]
- [Header] stored at the beginning of each Frame, with consistent format (e.g. YAML)
  - Includes metadata: timestamp
  - Includes Body content type: e.g. HTML vs Markdown vs. Plaintext vs. Blob
  - Does not include content by default, e.g. Tags, Author, Visibility
  - Can be extended to store arbitrary metadata, e.g. Tags, Author, Visiblity
  - [Header Plugin] that enables header parsing
- [Body plugin] detects Nodes and Edges, alone with metadata for each content type
  - Plugin that enables body parsing
- Graph uses indexer and query engine to search and retrieve nodes and edges

[sync algorithm]: ./RFC-20220611-conflict-free-sync-algorithm.md
[header]: ./RFC-20220724-frame-header.md
[body plugin]: ./RFC-20220724-plugins.md
[header plugin]: ./RFC-20220724-plugins.md
