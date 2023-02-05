-- Create the node table if not exists
CREATE TABLE IF NOT EXISTS node (
	id	        TEXT NOT NULL,
	urls	      TEXT NOT NULL,
	target_urls	TEXT,
	title	      TEXT,
	PRIMARY     KEY("id")
);

-- Create the FTS virtual table for title column
CREATE VIRTUAL TABLE IF NOT EXISTS fts_content USING fts5(id, title, urls, content='node');

CREATE TRIGGER IF NOT EXISTS tgr_fts_content_ai AFTER INSERT ON node BEGIN
    INSERT INTO fts_content(rowid, title) VALUES(new.rowid, new.title);
END;

CREATE TRIGGER IF NOT EXISTS tgr_fts_content_ad AFTER DELETE ON node BEGIN
  INSERT INTO fts_content(fts_content, rowid, title) VALUES('delete', old.rowid, old.title);
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_content_au AFTER UPDATE ON node BEGIN
  INSERT INTO fts_content(fts_content, rowid, title) VALUES('delete', old.rowid, old.title);
  INSERT INTO fts_content(rowid, title) VALUES(new.rowid, new.title);
END;

-- Create the FTS virtual table for urls and target_urls columns, with custom tokenizer
CREATE VIRTUAL TABLE IF NOT EXISTS fts_url USING fts5(id, title, urls, target_urls, content=node);

CREATE TRIGGER IF NOT EXISTS tgr_fts_url_ai AFTER INSERT ON node BEGIN
    INSERT INTO fts_url(rowid, urls, target_urls) VALUES (new.rowid, new.urls, new.target_urls);
END;

CREATE TRIGGER IF NOT EXISTS tgr_fts_url_ad AFTER DELETE ON node BEGIN
  INSERT INTO fts_url(fts_url, rowid, urls, target_urls) VALUES('delete', old.rowid, old.urls, old.target_urls);
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_url_au AFTER UPDATE ON node BEGIN
  INSERT INTO fts_url(fts_url, rowid, urls, target_urls) VALUES('delete', old.rowid, old.urls, old.target_urls);
  INSERT INTO fts_url(rowid, urls, target_urls) VALUES (new.rowid, new.urls, new.target_urls);
END;