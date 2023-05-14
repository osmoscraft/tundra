[Based on](./RFC-20230501-multi-module-sync-v2.md)

# Between Sync module and FS module

- Sync module uses private storage independent of FS module, tracking for each file
  - Local hash
  - Local timestamp
  - Remote hash
  - Remote timestamp
- Sync module updates remote hash/timestamp when cloning/pulling remote content
- Sync module updates local hash/timestamp only as the result of FS module updating its content
- FS module is unaware of the Sync module
- An orchestrator module manages causal dependency between Sync module and FS module
  - Clone/pull sequence
    - Sync module writes remote hash/timestamp
    - FS module writes the file
    - Sync module writes local hash/timestamp
  - Local write sequence
    - FS module writes the file
    - Sync module writes local hash/timestamp
  - Revert is the same as local write sequence
- Safe failure modes
  - If sync module didn't update, FS module will not update
  - Idempotent writes to sync module
  - Decouple fetching remote vs. writing local
- Each file has a change semantics based on hash and timestamp
  - e.g. when local time > remote time and local hash differs from remote hash => user intends to pusn file changes from local to remote

# Between Graph module and FS module

- Graph module uses private storage independent of FS module
- Graph module listens to `onWrite` event from FS module
  - Parse the file and update the corresponding Graph node
  - Update the last sync timestamp to match the file write timestamp
- onAppStart
  - Compare the last sync timestamp from Graph with the last file write timestamp from FS module
    - If FS latest timestamp > Graph latest timestamp, Graph module will request error recovery mode
    - Last known good timestamp should be the last sync timestamp
    - FS module will emit full sequence of `onOpen`, `onWrite` and `onClose` for all files newer than the timestamp
    - If Graph > FS, error. Graph must be rebuilt from scratch
