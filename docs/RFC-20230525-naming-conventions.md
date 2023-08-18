## Timestamp

- Prefer "CreatedTime" to "TimeCreated", "CreatedOn", "CreatedAt", "CreatedTimestamp", "ctime"
- Prefer "UpdatedTime"
- Prefer "DeletedTime"

## Status

- Prefer "Created" to "Added", "New"
- Prefer "Updated" to "Modified", "Changed"
- Prefer "Deleted" to "Removed"
- Git diff status is an exception to the above rules

## Audit

- schema.sql
  - None/Add/Remove/Modify/updatedAt
- git/compare.ts
  - added/removed/modified/renamed/copied/changed/unchanged
- git/remote-change-record.ts
  - added/modified/removed
- db/file.ts
  - update/get/delete/sync/list/search
- db/graph.ts
  - commit/fetch/clone/merge/push/resolve/untrack/get
-
