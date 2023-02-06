-- Create the node table if not exists
CREATE TABLE IF NOT EXISTS node (
	id	        TEXT NOT NULL,
	url	        TEXT NOT NULL UNIQUE,
  alt_urls    TEXT,
	target_urls	TEXT,
	title	      TEXT,
  modified_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
	PRIMARY     KEY("id")
);

CREATE VIRTUAL TABLE IF NOT EXISTS node_fts USING fts5(id, url, alt_urls, target_urls, title, content=node);

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ai AFTER INSERT ON node BEGIN
    INSERT INTO node_fts(rowid, url, alt_urls, target_urls, title) VALUES (new.rowid, new.url, new.alt_urls, new.target_urls, new.title);
END;

CREATE TRIGGER IF NOT EXISTS tgr_node_fts_ad AFTER DELETE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, url, alt_urls, target_urls, title) VALUES('delete', old.rowid, old.url, old.alt_urls, old.target_urls, old.title);
END;

CREATE TRIGGER IF NOT EXISTS trg_node_fts_au AFTER UPDATE ON node BEGIN
  INSERT INTO node_fts(node_fts, rowid, url, alt_urls, target_urls, title) VALUES('delete', old.rowid, old.url, old.alt_urls, old.target_urls, old.title);
  INSERT INTO node_fts(rowid, url, alt_urls, target_urls, title) VALUES (new.rowid, new.urls, new.alt_urls, new.target_urls, new.title);
END;