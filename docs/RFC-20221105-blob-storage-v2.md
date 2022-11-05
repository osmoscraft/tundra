# Blob Storage V2

- [prev](./RFC-20221031-alternative-blob-storage.md)

## Concepts

- Loose objects
- Changelog
- Snapshot
- Image

## Server

- Each changelog and the objects referenced by it are a unit of consistency
- Loose objects are keyed by SHA256 content hash
- A single changelog file for sync tracking
- An optional snapshot file that summarizes the objects into a single file

## Client

- Browser client
  - CRUD on single object
  - One-time bulb get all objects
- Snapshot bot client
  - Read new object
  - Maintain single snapshot file
- Indexer bot client
  - Clean up redundant entries in Snapshot

## Operations

- Create objects
  - Write blobs
  - Append `+<SHA256>\n` for each new object
- Update objects
  - Wirte new blobs
  - Append `+<NEW_SHA256>\n-<OLD_SHA256>\n` for each changed object
  - Set old blob content to blank
- Delete objects
  - Append `-<SHA256>\n` for each deleted object
  - Set blob content to blank
- Incremental pull
  - Find `<LATEST_ITEM_SHA256>` on client
  - If `<LATEST_ITEM_SHA256>` does not exist, fallback to snapshot pull
  - Find all keys appended after `<LATEST_ITEM_SHA256>`
  - Retrive blobs using the keys
- Snapshot pull
  - Find last known `<SNAPSHOT_SHA256>` on client
  - Rollback all actions after it (need to rollback local delete)
  - Find all keys appended after `!<SNAPSHOT_SHA256>` on the server
  - Retrive blobs and apply their changes
- Full clone
  - Find last available image

## Changelog Pruning

- 1st-time snapshot
  - Copy changelog to memory and make edits to it
  - For each `+<SHA256>`, remove the first `-<SHA256>` after it
  - Remove all duplicates (in fact, there shouldn't be any)
  - Append `!<SHA256>` as the last record
  - Flush changelog as object
- Incremental snapshot
  - Find the last known `!<SHA256>`, starting from it repeat the same as 1st-time snapshot

# Issues

- Insert vs append file
  - Append is used in this RFC
  - Insert improves read performance, especially top to bottom regex match
  - Append might improve write performance depending on filesystem implementation
- Tombstone proliferation
  - Each change operation produces two recordes, one for delete, one for create
  - The delete record must be kept around until all clients have digested them
  - Snapshot bot can auto prune the changelog and generate a matching snapshot
    - If a client's latest key was deleted by the pruning, it can recover the state with the snapshot
    - At most one snapshot bot can be running at time
- Keyed by content vs timestamp
  - Keyed by content is used in this RFC
  - Keyed by timestamp allows us omit the Changelog and use the UTF-8 character order of the keys as the changelog
  - Will loose the immutability of key-value pairs.
  - Require manual reconciliation in race condition
  - Require more complicated clean up when multiple-object operation fails
  - `<TIMESTAMP_SHORTSHA256>` as a combined solution
    - Write operation needs to enumerate all
- History tracking vs. space efficiency
  - Setting changed/deleted blob content to blank destorys histroy
  - Not setting the content leads to massive duplication
  - Delta compression solves both, at the cost of complexity and query performance
