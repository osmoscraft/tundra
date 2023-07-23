# YAML performance

- Goal: decide between using YAML vs. raw JSON for markdown frontmatter
- Tradeoff: YAML is more human readable, but JSON is more performant

## Benchmark results

- Synthetic benchmark:
  - https://measurethat.net/Benchmarks/Show/26392
  - [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse): 1.6M ops/sec
  - [js-yaml](https://github.com/nodeca/js-yaml): 360K ops/sec
  - [yaml](https://github.com/eemeli/yaml): 46K ops/sec
- s2-notes frontmatter parsing performance (3 runs, 1000 files)
  - Custom regex (only extracts title filed): 2.9ms | 3.0ms | 3.0ms
  - js-yaml: 22ms | 20ms | 16ms
  - yaml: 83ms | 95ms | 78ms

## Decision

- Going with yaml
  - The slowdown is not noticeable for the number of files we have
  - It has built-in typescript support
- Can switch to js-yaml in the future
