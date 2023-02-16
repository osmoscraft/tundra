-- Enable CLI headers
.headers on
.mode box
.separator ROW "\n"
.nullvalue NULL

-- Create the node table if not exists
CREATE TABLE IF NOT EXISTS node (
  body        TEXT,
  meta        TEXT,
  -- modified_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- virtual columns from JSON extractions
  alt_urls    TEXT GENERATED ALWAYS AS (json_extract(meta, '$.altUrls')),
  id          TEXT GENERATED ALWAYS AS (json_extract(meta, '$.id')) NOT NULL UNIQUE,
  modified_at TEXT GENERATED ALWAYS AS (json_extract(meta, '$.modifiedAt')) NOT NULL,
  tags        TEXT GENERATED ALWAYS AS (json_extract(meta, '$.tags')),
  target_urls TEXT GENERATED ALWAYS AS (json_extract(meta, '$.targetUrls')),
  title       TEXT GENERATED ALWAYS AS (json_extract(meta, '$.title')) NOT NULL,
  url         TEXT GENERATED ALWAYS AS (json_extract(meta, '$.url'))
);

CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(alt_urls, body, tags, target_urls, title, url, content=node);

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ai AFTER INSERT ON node BEGIN
    INSERT INTO node_fts(rowid, alt_urls, tags, target_urls, title, url)
    VALUES (new.rowid, new.alt_urls, new.tags, new.target_urls, new.title, new.url);
END;

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ad AFTER DELETE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, alt_urls, tags, target_urls, title, url)
  VALUES('delete', old.rowid, old.alt_urls, old.tags, old.target_urls, old.title, old.url);
END;

CREATE TRIGGER IF NOT EXISTS trg_node_fts_au AFTER UPDATE ON node BEGIN
  INSERT INTO node_fts( node_fts, rowid, alt_urls, tags, target_urls, title, url)
  VALUES('delete', old.rowid, old.alt_urls, old.tags, old.target_urls, old.title, old.url);
  INSERT INTO node_fts(rowid, alt_urls, tags, target_urls, title, url)
  VALUES (new.rowid, new.alt_urls, new.tags, new.target_urls, new.title, new.url);
END;

INSERT INTO node(meta, body) VALUES
  ('{"id": "0001", "modifiedAt": "20220101T12:34:00Z", "url": "https://alpha.com", "title": "My doc 1", "altUrls": "http://alpha.com", "targetUrls": "https://bravo.com", "tags": ["tag1", "tag2"]}', '# Hello, this is a document!'),
  ('{"id": "0002", "modifiedAt": "20220101T12:34:00Z", "title": "My doc 2", "targetUrls": "https://bravo.com"}', '# Hello, this is a document!');

SELECT * FROM node_fts WHERE node_fts MATCH '"bravo"';