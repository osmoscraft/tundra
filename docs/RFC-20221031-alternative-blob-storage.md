# Alternative Blob Storage

- Instead of Git, use low level blob storage (Amazon S3 and CloudFlare R2)
- Implement a subset of "git-like" storage layouts with a focus on synchronization performance
- Reverse delta compression for version tracking
  - Latest version stores full content and tracks previous oid
  - Previous version stores operations that can undo the latest version
