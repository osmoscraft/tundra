# Link Tracking

## Design considerations

- Parent track child vs. child point to parent
  - Storage efficiency
  - Portability
- Diamond dependency within the same document
- Lazy id creation vs eager id creation
  - Database bloat if eager
  - Need for garbage collection and ref counting if lazy
  - Touching 2-3 files changed when linking is lazy
  - Potential merge conflict when extraction/inlining happens
