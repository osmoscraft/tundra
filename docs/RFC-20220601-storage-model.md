# Application goal

- User face layer is a "Graph", allowing query and traversal
- Graph is composed of "Node" and "Edge"
  - Nodes and edges need to be tracked in either an in-memory indexer or in Indexed DB in a form that is ready for query
- "Node" and "Edge" must be persisted in the DB Layer so they are optimized for the "Graph" operations
- The storage format must be open, durable, and servicable, ruling out binary format.
- Git will receive first-class integration, requiring the the bottom layer to be "File" based
- Future compatibility with Browser native FS api also promotes a "File" based storage model

# Constraints

- Parsing and serialization required when converting between file and query-friendly objects
- Isomophric Git is the only in-browser Git provider at this point, and requires an FS interface

# Solutions

- Technologies considered
  - Isomorphic Git
  - Lightning FS
  - Dexie
  - FlexSearch

## Object-first storage

- Persistence:
  - Dexie as source of truth
  - Information stored as js primitives
- Consumption:
  - Dexie Hooks provides observability when object mutates
  - Data can be queried with Dexie API, or ingested into a search provider
- Sync
  - An adaptor that provides FS interface on top of Dexie
    - Data read/write require serialization and parsing of JSON
    - Stat listing can rely on metadata persisted inside object
      - Potential mix of concerns
- Pro
  - High query performance
  - Simple reactive hooks
  - Not bound to Git
  - Data is easily human inspectable
  - Flexible sync strategy
- Con
  - FS adaptor complexity

## File-first storage

- Persistence:
  - Files in Lightning FS as source of truth
  - Information represent as Binary Bytes Array
- Consumption
  - Lightning FS provides API to decode file content and write string into file
  - A separate indexer is required to query file content
  - Lighning FS must be wrapped in an audit layer for reactive event handling by indexer
- Sync
  - Isomorphic Git can directly call into Lightning FS
    - The audit layer will maintain identical API to Lighning FS
- Pro
  - High sync performance
  - Flexible FS layer implementation
  - Future proof for native FS integration
- Con
  - Audit wrapper complexity
  - Parsing step required for querying
  - Difficult to debug storage content

## Combined solution

- FS Module:
  - LightningFS or BrowserFS, with File based model
  - All write operations go through an audit layer
  - Not aware of business logic (no idea about graph, nodes, edges)
  - Expose file watcher hooks
- Graph Module:
  - On-disk persistence with Indexed DB (potentially Dexie)
  - Optional query enhancement with FlexSearch
    - Index can be persisted as binary in a standalone Indexed DB
  - Using wathcer hooks to update Graph Module and search index
- Sync module:
  - Optional add-on
  - Integrate with FS Module read and write API
- Dependency graph
  FS Module <- Sync Module
  FS Module <- Graph Module
  Graph Module -x- Sync module
