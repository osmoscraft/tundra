[Based on](./RFC-20230415-modular-redesign.md)

# Between Sync module and FS module

- Sync module has two tables
  - Local stage
    - path
    - from
    - to
  - Remote stage
    - path
    - to
- Content representation
  - String for latest text content
  - NUL in the Local.to or Remote.content for means deleted
  - NUL in the Local.from means no previous content
- Rules
  - When Local.to == Remote.to: sync complete, remove record
  - When Local.from == Remote.to && Remote has no record: change is cancelled, remove record
  - When Local.to != Remote.to: conflict. Require user action
- Hooks
  - Sync module listens to FS module file change event
    - Set Local.to = new content
    - Set Local.from = previous content only if no record exists for this path
  - Sync module listens to fetch action by user
    - Download latest content
    - Set Remote.to = latest content
  - Sync module listens to merge action by user
    - When there is conflict, require user action
      - V1 will auto-resolve conflict by using remote as source of truth
    - Emit mergeRemoteEvent, with Remote.to as content
  - Sync module listens to revert action by user
    - Emit revertLocalEvent, with Local.from as content
  - Sync module listens to push action by user
    - Must run fetch and merge first
    - Upload latest content, with Local.to as content
  - FS module listens to mergeRemoteEvent, revertLocalEvent
    - Write to FS and emit file change event
