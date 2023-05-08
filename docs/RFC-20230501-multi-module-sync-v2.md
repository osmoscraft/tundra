[Based on](./RFC-20230416-multi-module-sync.md)

# Between Sync module and FS module

- Sync module uses private storage independent of FS module
- FS emits async event without hard coupling
  - onOpenForWrite
    - Sync module receives file path and content
    - Sync module creates a copy of the content, `content.backup`, if not exists
  - onWrite
    - Sync module receives file path and content
    - Sync module creates a copy of the content, `content.new`, overwrite any existing copy
  - onClose
    - Sync module receives file path and content
    - Sync module compares `content.new` with `content.backup`
      - If different, delete `content.new`
      - If same, delete both `content.backup` and `content.new`
- At the end of each FS action, we can have the following guarantees
  - Neither `content.backup` nor `content.new` exists => no change
  - `content.backup` exists, `content.new` does not => file needs sync
  - `content.backup` and `content.new` both exist => file is being edited, pending `onClose` check or `onAppStart` check
- onAppStart
  - If any `content.new` exists, Sync module will request error recovery mode
  - Last known good timestamp should be the oldest timestamp from the `content.backup` files that have a corresponding `content.new` file
  - FS module will emit full sequence of `onOpen`, `onWrite` and `onClose` for all files newer than the timestamp
- Sync module allows revert
  - Sync module requests FS module to write ``content.backup` to file
  - the `onClose` action will delete `content.backup` and `content.new`
- During initial clone, write each file as `content.backup` and wait for FS to emit `content.new` that cancels out the change
- Sync module should prominently alert user when it fails to perform the `onOpenForWrite` action
- Semantics for changes
  - `.backup` does not exist, `.new` does not exist => no change
  - `.backup` is empty, `.new` has content => to create
  - `.backup` has content, `.new` is empty => to delete
  - `.backup` has content, `.new` has content => editing
  - `.backup` has content, `.new` does not exist => to change
  - Otherwise => error

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
