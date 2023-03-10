CREATE TABLE IF NOT EXISTS node (
  path        TEXT PRIMARY KEY,
  value       TEXT
  -- virtual columns from JSON extractions
  -- alt_urls    TEXT GENERATED ALWAYS AS (json_extract(value, '$.altUrls')),
  -- id          TEXT GENERATED ALWAYS AS (json_extract(value, '$.id')) NOT NULL UNIQUE,
  -- modified_at TEXT GENERATED ALWAYS AS (json_extract(value, '$.modifiedAt')) NOT NULL,
  -- note        TEXT GENERATED ALWAYS AS (json_extract(value, '$.note')),
  -- tags        TEXT GENERATED ALWAYS AS (json_extract(value, '$.tags')),
  -- target_urls TEXT GENERATED ALWAYS AS (json_extract(value, '$.targetUrls')),
  -- title       TEXT GENERATED ALWAYS AS (json_extract(value, '$.title')) NOT NULL,
  -- url         TEXT GENERATED ALWAYS AS (json_extract(value, '$.url'))
);

CREATE TABLE IF NOT EXISTS ref (
  type TEXT PRIMARY KEY,
  id   TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(path, value, content=node);

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ai AFTER INSERT ON node BEGIN
    INSERT INTO node_fts(rowid, path, value)
    VALUES (new.rowid, new.path, new.value);
END;

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ad AFTER DELETE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, path, value)
  VALUES('delete', old.rowid, old.path, old.value);
END;

CREATE TRIGGER IF NOT EXISTS trg_node_fts_au AFTER UPDATE ON node BEGIN
  INSERT INTO node_fts( node_fts, rowid, path, value)
  VALUES('delete', old.rowid, old.path, old.value);
  INSERT INTO node_fts(rowid, path, value)
  VALUES (new.rowid, new.path, new.value);
END;