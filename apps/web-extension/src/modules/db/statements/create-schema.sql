CREATE TABLE IF NOT EXISTS node (
  path        TEXT PRIMARY KEY,
  content     TEXT,
  -- virtual columns from JSON extractions
  -- alt_urls    TEXT GENERATED ALWAYS AS (json_extract(content, '$.altUrls')),
  -- id          TEXT GENERATED ALWAYS AS (json_extract(content, '$.id')) NOT NULL UNIQUE,
  -- note        TEXT GENERATED ALWAYS AS (json_extract(content, '$.note')),
  -- target_urls TEXT GENERATED ALWAYS AS (json_extract(content, '$.targetUrls')),
  -- title       TEXT GENERATED ALWAYS AS (json_extract(content, '$.title')) NOT NULL,
  modifiedAt TEXT GENERATED ALWAYS AS (json_extract(content, '$.modifiedAt')),
  tags       TEXT GENERATED ALWAYS AS (json_extract(content, '$.tags')),
  url        TEXT GENERATED ALWAYS AS (json_extract(content, '$.url'))
  links      TEXT GENERATED ALWAYS AS (json_extract(content, '$.links')),
);

CREATE TABLE IF NOT EXISTS ref (
  type TEXT PRIMARY KEY,
  id   TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(path, content, content=node);

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ai AFTER INSERT ON node BEGIN
    INSERT INTO node_fts(rowid, path, content)
    VALUES (new.rowid, new.path, new.content);
END;

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ad AFTER DELETE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, path, content)
  VALUES('delete', old.rowid, old.path, old.content);
END;

CREATE TRIGGER IF NOT EXISTS trg_node_fts_au AFTER UPDATE ON node BEGIN
  INSERT INTO node_fts( node_fts, rowid, path, content)
  VALUES('delete', old.rowid, old.path, old.content);
  INSERT INTO node_fts(rowid, path, content)
  VALUES (new.rowid, new.path, new.content);
END;