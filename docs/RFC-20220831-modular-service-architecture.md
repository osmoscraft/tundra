# High level design

Goal: separate functional units for independent development and deployment
Constraints: must ensure data integrity when a module fails

- File module
  - Virtual file system
  - Change tracking
- Graph module
  - Two way link tracking
- Sync module
  - Version tracking, network sync
- Search module
  - Full text search

## Error recover via visitor tracking

```typescript
interface FileSchema {
  id: string;
  content: string;
  visitorIds: string[]; // <- Which modules should visit this file
}

interface FileModule {
  installModules(ids: string[]): void; // <- Add ids to all records
  unstinallModules(ids: string[]): void; // <- Remove ids from all records
  visit(moduleId: string): any[] // <- Get all records that the module should visit.
  markAsVisited(moduleIds string, recordIds: string[]): void // <- Mark records as visited by a module
}
```

- When file updteas, visitorIds are set to all the modules that should visit this file
- Error recovery: On app start, modules will visit any left-over files that are marked for visit
