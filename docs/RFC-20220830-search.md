# Tokenization

- Preprocess
  - No need if indexing on inner HTML
  - Scrub markdown symbols otherwise
- Intl Segmenter
  - How to heal from bad index?
  - How to migrate when dictionary updates?
  - How to choose the correct locale?
  - No available in FireFox
    - Polyfill: https://github.com/surferseo/intl-segmenter-polyfill
- Hand-built tokenizer: porter stemmer

# Storage

- Stand alone
  - Modular, can independently update without touching content DB
  - Require error recovery logic due to non-atomic transaction
- Co-location with content
  - Simple
  - Coupled, causing migration stress

# Indexer

- Index on local node add/change/delete
- Index added/changed/deleted nodes on pull
- Keeps local journal on indexing result
  - Re-submit resolved indexing requests on start
  - Indexer should be itempotent

# Ranking

- Boost 0-indent items
  - May require storing row and indent with the token
  - May require search-time token matching per hit document
