# Concept A - Version control embedded in storage

- File module
  - Each node tracks it's own status: create|update|delete|clean
- Sync module
  - Tracks latest local commit
  - On Save
    - File module update content + status in atomic transaction
  - On Pull
    - Get remote commit, if no newer than local commit, stop
    - Send changeset (including remote commit id) to File store
    - File store digest all changed files, set status to clean
    - File store send changeset confirmation (commit id) to sync module
    - Sync module update local commit id to the one received in the confirmation
  - On Push
    - Request File module for changeset
    - File module send changset to sync module
    - Sync module push all changes to remote, upload local commit id

# Concept A.2 - Version control embedded in storage

- File module
  - Each node tracks content:base-hash:status
- Sync module
  - Tracks latest local commit
  - On Save
    - File module update content:status in atomic transaction, status is derived from base-hash comparison
      - create: no base-hash but has new-hash
      - update: base-hash and new-hash differ
      - delete: has base-hash but no new-hash
  - On Pull
    - Get remote commit, if no newer than local commit, stop
    - Send changeset id:content (including remote commit id) to File store
    - File store digest all changed files, update id:content:base-hash:status, where base-hash is computed from content, and status clean
    - File store send changeset confirmation (commit id) to sync module
    - Sync module update local commit id to the one received in the confirmation
  - On Push
    - Sync module request File module for changeset
    - File module send changset by checking status to sync module
    - Sync module push all changes to remote, upload local commit id
    - Sync module send updated ids to File module
    - File module updates content:base-hash:status

# Concept B - Version control split across modules

- File module
  - The module holds a system-wide rev number, increment on each write
  - Each node tracks the rev number associated with the node's latest update
- Sync module
  - Tracks latest local commit
  - Each node tracks the rev number that is synced with the remote
  - On pull
    - Get remote commit, if no newer than local commit, stop
    - Send changeset + commit id to File module
    - File module digest all changes, increment rev number as needed
    - File module send confirmation with commit id + node:rev dictionary to sync module
    - Sync module update latest local commit and tracked rev numbers
  - On push
    - Sync module request push changeset by sending max synced rev number to file module
    - File module respond with all nodes that are newer than the rev number
    - Sync module push changes to remote, update local commit id, and update rev number to be the latest from file module

# Concept C - Fully decoupled

- File module
  - Each node only tracks its content
- Sync module
  - Tracks latest local commit
  - Each node tracks base content hash and change status
  - On Save
    - File module save content (if crash after, will need to re-save)
    - File module emit id:content to sync module
    - Sync module computes id:new-hash
    - Sync module updates id:status
  - On Pull
    - Sync module download changeset
    - Send id:content pairs to File module
    - File module trigger On Save flow
  - On Push
    - Sync module request all changed items (id:content) from File module
    - Push to remote, get commit id (if crash after, next Pull will be equivalent to run-to-finish)
    - Update latest commit id, update all pushed id:base-hash to be id:new-hash, set status to clean

# Concept C.2 - with error recovery

- Sync module
  - On Save
    - File module save content and set pending visitor flags: search,sync,link module
    - File module emit change event to all modules
    - Each module process the changed node and clear its flag
  - On start
    - File module will re-emit change event all any nodes that hasn't cleared the flags

# Appendix

- Track local changes
  - Store dirty flag next to content
    - Will mark undo as a false positive change
    - Easy to gather all changed files
  - Store both base hash and head hash, compare to detect change
    - Can detect undo as a non-change
    - O(N) to gather all changed files
  - Hybrid: Store base hash and dirty flag
    - Dirty flag derived from comparing base hash with content
    - Use dirty flag to gather all changed files
    - On content change, rerun the hash and compare to update the flag
    - On sync update both content and hash, and derive the clean flag
