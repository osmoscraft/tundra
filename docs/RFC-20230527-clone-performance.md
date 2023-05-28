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

# Insight

- Use Tarball for best performance
- Adopt virtual path to avoid file name length issues
