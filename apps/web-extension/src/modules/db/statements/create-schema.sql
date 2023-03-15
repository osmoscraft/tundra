CREATE TABLE IF NOT EXISTS node (
  path       TEXT PRIMARY KEY,
  content    TEXT,
  -- virtual columns from JSON extractions
  -- alt_urls    TEXT GENERATED ALWAYS AS (json_extract(content, '$.altUrls')),
  title      TEXT GENERATED ALWAYS AS (json_extract(content, '$.title')) NOT NULL,
  url        TEXT GENERATED ALWAYS AS (json_extract(content, '$.url')),
  modifiedAt TEXT GENERATED ALWAYS AS (json_extract(content, '$.modifiedAt')),
  tags       TEXT GENERATED ALWAYS AS (json_extract(content, '$.tags')),
  links      TEXT GENERATED ALWAYS AS (json_extract(content, '$.links'))
);

CREATE TABLE IF NOT EXISTS ref (
  type TEXT PRIMARY KEY,
  id   TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(path, content, title, url, links, content=node);

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ai AFTER INSERT ON node BEGIN
    INSERT INTO node_fts(rowid, path, content, title, url, links)
    VALUES (new.rowid, new.path, new.content, new.title, new.url, new.links);
END;

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ad AFTER DELETE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, path, content, title, url, links)
  VALUES('delete', old.rowid, old.path, old.content, old.title, old.url, old.links);
END;

CREATE TRIGGER IF NOT EXISTS trg_node_fts_au AFTER UPDATE ON node BEGIN
  INSERT INTO node_fts( node_fts, rowid, path, content, title, url, links)
  VALUES('delete', old.rowid, old.path, old.content, old.title, old.url, old.links);
  INSERT INTO node_fts(rowid, path, content, title, url, links)
  VALUES (new.rowid, new.path, new.content, new.title, new.url, new.links);
END;