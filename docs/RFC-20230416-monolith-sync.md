[Alternative to](./RFC-20230416-multi-module-sync.md)

# FS module also functions as a Journaling FS

- FS has a single table
  -File table
  - path
  - localHistory
    - Tracks a list of local changes that is not synced yet
    - Initial value is JSON array `[null]`
- Sync has a single table:
  - Remote table
    - path
    - content
- Rules
  - The history must always have one or more items
  - The item is considered dirty when the head != tail
  - Conflict when localHistory is dirty && Remote has content && localHistory tail != Remove.content
- Sync operations
  - FS write
    - Append to localHistory
    - Create new file `[null, "new value"]`
    - Update file `["old value", "new value"]`
    - Delte file `["old value", null]`
  - Revert all local changes
    - Only possible when history length > 1
    - Remove all but the first item from the history
  - Fetch
    - Populate Remote table with content
    - If localHistory.length ==1 && Remote.content == localHistory tail, remove Remote record
  - Merge
    - Stop if conflict detected
      - V1 will continue, assuming remote as source of truth
    - Replace localHistory with array of single value `[Remote.content]`
  - Push
    - Fetch and Merge first
    - Take latest value from localHistory, upload to server
    - Fetch and Merge again
