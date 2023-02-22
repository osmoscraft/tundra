CREATE TABLE IF NOT EXISTS node (
  body        TEXT,
  meta        TEXT,
  change      TEXT CHECK (change IN ('created', 'modified', 'deleted')),
  -- virtual columns from JSON extractions
  alt_urls    TEXT GENERATED ALWAYS AS (json_extract(meta, '$.altUrls')),
  id          TEXT GENERATED ALWAYS AS (json_extract(meta, '$.id')) NOT NULL UNIQUE,
  modified_at TEXT GENERATED ALWAYS AS (json_extract(meta, '$.modifiedAt')) NOT NULL,
  tags        TEXT GENERATED ALWAYS AS (json_extract(meta, '$.tags')),
  target_urls TEXT GENERATED ALWAYS AS (json_extract(meta, '$.targetUrls')),
  title       TEXT GENERATED ALWAYS AS (json_extract(meta, '$.title')) NOT NULL,
  url         TEXT GENERATED ALWAYS AS (json_extract(meta, '$.url'))
);

CREATE TABLE IF NOT EXISTS ref (
  type TEXT PRIMARY KEY,
  id   TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(alt_urls, id, body, tags, target_urls, title, url, content=node);

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ai AFTER INSERT ON node BEGIN
    INSERT INTO node_fts(rowid, id, alt_urls, tags, target_urls, title, url)
    VALUES (new.rowid, new.id, new.alt_urls, new.tags, new.target_urls, new.title, new.url);
END;

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ad AFTER DELETE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, id, alt_urls, tags, target_urls, title, url)
  VALUES('delete', old.rowid, old.id, old.alt_urls, old.tags, old.target_urls, old.title, old.url);
END;

CREATE TRIGGER IF NOT EXISTS trg_node_fts_au AFTER UPDATE ON node BEGIN
  INSERT INTO node_fts( node_fts, rowid, id, alt_urls, tags, target_urls, title, url)
  VALUES('delete', old.rowid, old.id, old.alt_urls, old.tags, old.target_urls, old.title, old.url);
  INSERT INTO node_fts(rowid, id, alt_urls, tags, target_urls, title, url)
  VALUES (new.rowid, new.id, new.alt_urls, new.tags, new.target_urls, new.title, new.url);
END;