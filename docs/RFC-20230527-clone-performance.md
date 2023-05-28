# Observations

- Tarball
  - Fast download
  - Fast decode
    - 10,000 in 10 seconds
    - 500 in 0.3 seonds
  - File name is truncated to 100 characters, including the long git commit hash as the root directory name
- GraphQL
  - Fast download
    - 500 in 3 seconds
  - Fast decode
- Zipball
  - Fast download
  - Slow decode
    - 500 in 30 seconds
- Further delay in sqlite write operation
  - 100ms per file
  - This is the bottleneck
  - The slowness seems abnormal

# Insight

- Tarball is ruled out for file name issue
- Need to benchmark sqlite wasm performance
- Need to bulk insert sqlite
- Unzip is still the secondary bottleneck with no solution yet
- Consolidate all sqlite databases into a single one
