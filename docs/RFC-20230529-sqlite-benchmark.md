# CRUD Observations

- 100 files, 100 insert, 100 tx
  - total 1190.7100000083447ms | avg 11.907100000083446ms per file
- 10k files, 10k insert, 1 tx
  - total 2437.520000010729ms | avg 0.2437520000010729ms per file
- 10k files, 1 insert, 1 tx
  - total 9742.910000011325ms | avg 0.9742910000011324ms per file
- 10k files, 1000 insert, 1 tx
  - total 1339.155000001192ms | avg 0.1339155000001192ms per fil
- 10k files, 100 insert, 1 tx
  - total 1205.0550000071526ms | avg 0.12050550000071525ms per file
- 10k files, 10 insert, 1 tx
  - total 1988.1199999898672ms | avg 0.19881199999898672ms per file
- 50k files, 100 per insert, 1 tx
  - total 7422.789999991655ms | avg 0.1484557999998331ms per file
- 1m files, 100 per insert, 1 tx
  - total 174308.7349999994ms | avg 0.1743087349999994ms per file

# Search performance

- FTS on 10,000 long markdown notes average 1 second latency
- FTS on 1,000 short markdown notes average 25 ms latency

# Insight

- 50x speed up when combining inserts into a single transaction
- Sweet spot appears to be around 100 rows per insert
- FTS performance is roughly linear with content size
