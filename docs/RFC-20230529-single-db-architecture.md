- Motivated by
  - [Clone performance issues](./RFC-20230527-clone-performance.md)
  - [Benchmark](./RFC-20230529-sqlite-benchmark.md)

# Schema

```typescript
interface File {
  path: string;
  content: string | null; // null indicated deletion
  updatedTime: number;
  localHash: string | null; // null indicates deletion
  remoteHash: string | null; // null indicates deletion or not created yet
}
```

# Sync Semantics

- clone
  - all fields will be set
  - content, localHash, remoteHash will be null for tombstone records
  - updatedTime will be last commit time from remote
- pull
  - if local has no file at path, same as clone
  - if local has content and updateTime >= remoteUpdateTime, no-op
  - if local has content and updateTime < remoteUpdateTime, overwrite local
- push
  - first, a pull is required to guarantee that local won't overwrite remote by accident
  - find all files where localHash != remoteHash
  - push local content to remote
