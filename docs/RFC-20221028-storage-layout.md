# Storage layout

- Designed with the [Sync algorithm](./RFC-20221027-sync-algorithm-implementation.md) and git database in mind
- Each frame is stored flat at `/fs/YYYYMMDDSSSS.md`
  - Flat storage leads to simplest path parsing
    - Allows relative path for all files
  - Git can hold 100k files in single folder without performance issue
    - Tested with 140k files in flat folder. GitHub API can diff commits < 400ms
  - When files out grow the limit, sub-foldering or custom sync service can be added (as a pro user scenario)
- Alternatively each frame is stored at `/fs/YYYY/MM/DD/<guid>.md`
  - Hierarchical storage is used because
    - GitHub API cannot handle more than 10k objects per tree node
    - Git database might suffer from adjacent change performance issues when a folder is too wide
    - Leaves room for potential special files
      - `/fs/YYYY.md`, `/fs/YYYY/MM.md`, `/fs/YYYY/MM/DD.md` for anual, monthly, daily file.
  - Alternatives
    - `/fs/YYYYMMDD/<guid>.md` can scale up to 270+ years
    - `/fs/YYYY/<guide.md>`
- Internal links uses
  - Either absolute url `[Link to another frame](/fs/2022/01/01/abcdefghijk.md)`
    - Easier to parse, but requires specific repo structure
  - Or relative url `[Link to another frame](../../../2022/01/01/abcdefghijk.md)`
    - More portable, but difficult to parse. Parser must track current location
