## Status

- Try use github's diff status as source of truth
  - Ref: https://stackoverflow.com/questions/10804476/what-are-the-status-types-for-files-in-the-github-api-v3/72849078#72849078
- Prefer "Added" to "Created" or "New"
- Prefer "Modified" to "Updated" or "Changed".
- Prefer "Removed" to "Deleted"
  - Due to javascript reserved keyword
- "Update" indicates any of: add/remove/modify

## Audit

- schema.sql
  - None/Add/Remove/Modify/updatedAt
- git/compare.ts
  - added/removed/modified/renamed/copied/changed/unchanged
- git/remote-change-record.ts
  - added/modified/removed
- db/file.ts
  - update/get/remove/sync/list/search
- db/graph.ts
  - commit/fetch/clone/merge/push/resolve/untrack/get
