-- Enable CLI headers
.headers on
.mode box
.separator ROW "\n"
.nullvalue NULL

CREATE TABLE IF NOT EXISTS node (
  path        TEXT PRIMARY KEY,
  content     TEXT,
  -- virtual columns from JSON extractions
  -- alt_urls    TEXT GENERATED ALWAYS AS (json_extract(content, '$.altUrls')),
  -- id          TEXT GENERATED ALWAYS AS (json_extract(content, '$.id')) NOT NULL UNIQUE,
  -- createdAt TEXT GENERATED ALWAYS AS (json_extract(content, '$.createdAt')),
  modifiedAt TEXT GENERATED ALWAYS AS (json_extract(content, '$.modifiedAt')),
  searchText TEXT GENERATED ALWAYS AS (json_remove(content, '$.modifiedAt'))
  -- note        TEXT GENERATED ALWAYS AS (json_extract(content, '$.note')),
  -- tags        TEXT GENERATED ALWAYS AS (json_extract(content, '$.tags')),
  -- target_urls TEXT GENERATED ALWAYS AS (json_extract(content, '$.targetUrls')),
  -- title       TEXT GENERATED ALWAYS AS (json_extract(content, '$.title')) NOT NULL,
  -- url         TEXT GENERATED ALWAYS AS (json_extract(content, '$.url'))
);

CREATE TABLE IF NOT EXISTS ref (
  type TEXT PRIMARY KEY,
  id   TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(path, searchText, content=node);


-- FTS trigger

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ai AFTER INSERT ON node BEGIN
  INSERT INTO node_fts(rowid, path, searchText)
  VALUES (new.rowid, new.path, new.searchText);
  UPDATE node SET content=json_set(content, '$.modifiedAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) WHERE rowid = new.rowid;
END;

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ad AFTER DELETE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, path, searchText)
  VALUES('delete', old.rowid, old.path, old.searchText);
END;

CREATE TRIGGER IF NOT EXISTS trg_node_fts_au AFTER UPDATE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, path, searchText)
  VALUES('delete', old.rowid, old.path, old.searchText);
  INSERT INTO node_fts(rowid, path, searchText)
  VALUES (new.rowid, new.path, new.searchText);
  UPDATE node SET content=json_set(content, '$.modifiedAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) WHERE rowid = new.rowid;
END;


INSERT INTO node(path, content) VALUES
  ('0001.json', '{"title": "Title 1"}'),
  ('0002.json', '{"title": "Title 2"}'),
  ('0003.json', '{"title": "Title 3"}');

SELECT * FROM node;

UPDATE node SET content='{"title": "Title modified"}' WHERE path = '0002.json';

SELECT * FROM node;

INSERT INTO node(path, content) VALUES
  ('0004.json', '{"title": "Title 4"}');

UPDATE node SET content='{"title": "Title modified 22"}' WHERE path = '0003.json';

INSERT INTO node(path, content) VALUES
  ('0005.json', '{"title": "Title 5"}');

SELECT * FROM node;

SELECT * FROM node_fts WHERE node_fts MATCH '"modified"';