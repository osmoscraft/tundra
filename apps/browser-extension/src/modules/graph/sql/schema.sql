CREATE TABLE IF NOT EXISTS Node (
  path       TEXT PRIMARY KEY,
  data       TEXT,
  -- virtual columns from JSON extractions
  title      TEXT GENERATED ALWAYS AS (json_extract(data, '$.title')) NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS NodeFts USING fts5(path, title, content=Node);

CREATE TRIGGER IF NOT EXISTS NodeFtsAfterInsertTrigger AFTER INSERT ON Node BEGIN
    INSERT INTO NodeFts(rowid, path, title)
    VALUES (new.rowid, new.path, new.title);
END;

CREATE TRIGGER IF NOT EXISTS NodeFtsAfterDeleteTrigger AFTER DELETE ON Node BEGIN
  INSERT INTO NodeFts(NodeFts, rowid, path, title)
  VALUES('delete', old.rowid, old.path, old.title);
END;

CREATE TRIGGER IF NOT EXISTS NodeFtsAfterUpdateTrigger AFTER UPDATE ON Node BEGIN
  INSERT INTO NodeFts( NodeFts, rowid, path, title)
  VALUES('delete', old.rowid, old.path, old.title);
  INSERT INTO NodeFts(rowid, path, title)
  VALUES (new.rowid, new.path, new.title);
END;