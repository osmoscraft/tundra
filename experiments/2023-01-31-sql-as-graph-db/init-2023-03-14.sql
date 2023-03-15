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
  -- modifiedAt TEXT GENERATED ALWAYS AS (json_extract(content, '$.modifiedAt')),
  -- searchText TEXT GENERATED ALWAYS AS (json_remove(content, '$.modifiedAt'))
  -- note        TEXT GENERATED ALWAYS AS (json_extract(content, '$.note')),
  tags        TEXT GENERATED ALWAYS AS (json_extract(content, '$.tags')),
  links       TEXT GENERATED ALWAYS AS (json_extract(content, '$.links')),
  title       TEXT GENERATED ALWAYS AS (json_extract(content, '$.title')),
  url         TEXT GENERATED ALWAYS AS (json_extract(content, '$.url'))
);


CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(path, title, tagList, targetUrlList, anyText, content='');
-- CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(path, anyText, title, tagList, content='');


CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ai AFTER INSERT ON node BEGIN
  INSERT INTO node_fts(rowid, path, title, tagList, targetUrlList, anyText)
  VALUES (
    new.rowid,
    new.path,
    new.title,
    (SELECT group_concat(value) FROM json_each(new.tags)),
    (SELECT group_concat(value) FROM json_tree(new.links) WHERE key = 'url'),
    (SELECT group_concat(value) FROM json_tree(new.content) WHERE atom iS NOT NULL)
  );
END;

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ad AFTER DELETE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, path, title, tagList, targetUrlList, anyText)
  VALUES(
    'delete',
    old.rowid,
    old.path,
    old.title,
    (SELECT group_concat(value) FROM json_each(old.tags)),
    (SELECT group_concat(value) FROM json_tree(old.links) WHERE key = 'url'),
    (SELECT group_concat(value) FROM json_tree(old.content) WHERE atom iS NOT NULL)
  );
END;

CREATE TRIGGER IF NOT EXISTS trg_node_fts_au AFTER UPDATE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, path, title, tagList, targetUrlList, anyText)
  VALUES(
    'delete',
    old.rowid,
    old.path,
    old.title,
    (SELECT group_concat(value) FROM json_each(old.tags)),
    (SELECT group_concat(value) FROM json_tree(old.links) WHERE key = 'url'),
    (SELECT group_concat(value) FROM json_tree(old.content) WHERE atom iS NOT NULL)
  );
  INSERT INTO node_fts(rowid, path, title, tagList, targetUrlList, anyText)
  VALUES (
    new.rowid,
    new.path,
    new.title,
    (SELECT group_concat(value) FROM json_each(new.tags)),
    (SELECT group_concat(value) FROM json_tree(new.links) WHERE key = 'url'),
    (SELECT group_concat(value) FROM json_tree(new.content) WHERE atom iS NOT NULL)
  );
END;


INSERT INTO node(path, content) VALUES
  ('0001.json', '{"title": "Title 1", "tags": ["book", "todo"]}'),
  ('0002.json', '{"title": "Title 2", "links": [{"title": "Link custom", "url": "https://example.com/1"}, {"title": "Link 2", "url": "https://example.com/2"}]}'),
  ('0003.json', '{"title": "Title 3", "Description": "Once upon a time, there is a boy."}');


UPDATE node SET content='{"title": "Title 3 modified"}' WHERE path = '0003.json';

SELECT * FROM node WHERE rowid IN (
  SELECT rowid FROM node_fts WHERE node_fts MATCH '"Link custom"'
);