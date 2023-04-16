[Based on](./RFC-20230415-modular-redesign.md)

- Coordinator starts
  - Set up listener for Sync, FS, Graph events
- Sync service iterate remote objects
  - Emit event on remote available version
  - Emit event for each object with op_id, object_id
- FS listens to sync event
  - Update local copy
  - Emit event for each file change, with op_id, object_id
- Graph service listens to FS change
  - Upload local node
  - Emit event for node update, with op_id, object_id
- Coordinator observe events
  - Mark the available version as sync in progress
  - On each sync service event, append an entry to object list
  - On both FS and Graph service event, resolve the matching object
  - When all objects are resolved, update sync history with the version
