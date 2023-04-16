-- Enable CLI headers
.headers on
.mode box
.separator ROW "\n"
.nullvalue NULL

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

INSERT INTO node(path, content) VALUES
  ('0001.json', '{"title": "Title 1"}'),
  ('0002.json', '{"title": "Title 2", "links": [{"title": "Link 1", "url": "https://example.com/1"}, {"title": "Link 2", "url": "https://example.com/2"}]}'),
  ('0003.json', '{"title": "Title 3", "links": [{"title": "Link 1", "url": "https://example.com/1"}, {"title": "Link 3", "url": "https://example.com/3"}]}'),
  ('0004.json', '{"title": "Title 4", "links": [{"title": "Link 4", "url": "https://example.com/4"}]}');


-- In nodes: find all nodes whose links contain a url
SELECT * FROM node_fts WHERE links MATCH '"https://example.com/1"' ORDER BY rank;

INSERT INTO node(path, content) VALUES
  ('0005.json', '{"title": "Title 5", "url": "https://example.com/5"}'),
  ('0006.json', '{"title": "Title 6", "url": "https://example.com/6"}'),
  ('0007.json', '{"title": "Title 7", "url": "https://example.com/7"}'),
  ('0008.json', '{"title": "Title 8", "url": "https://example.com/8"}');

-- Out captured: find all nodes whose url is one of the provided urls
SELECT * FROM node_fts WHERE url MATCH '"https://example.com/5" OR "https://example.com/6"' ORDER BY rank;

-- Out shared by captured: find all nodes whose links contain one of the provides urls
SELECT * FROM node_fts WHERE links MATCH '"https://example.com/1" OR "https://example.com/3"' ORDER BY rank;


