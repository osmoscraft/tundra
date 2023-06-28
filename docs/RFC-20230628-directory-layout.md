# Layout

```
/
├── .gitignore
├── data
│   ├── notes
│   ├── bookmarks
│   └── feeds
└── config
    ├── editor
    │   ├── theme.yml
    │   └── keymap.yml
    ├── feed
    │   └── feed.yml
    └── sync
        └── github.yml
```

`.gitignore` content:

```
data/feeds/*
sync/github.yml
```

`github.yml` content:

```yml
repo: ...
owner: ...
headCommit: ...
token: ...
```
