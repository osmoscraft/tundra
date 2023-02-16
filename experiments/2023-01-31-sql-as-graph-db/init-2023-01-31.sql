-- Create the document table if not exists
CREATE TABLE document (
	id	        TEXT NOT NULL,
	urls	      TEXT NOT NULL,
	target_urls	TEXT,
	title	      TEXT,
	PRIMARY     KEY("id")
);

-- Create the FTS virtual table for title column
CREATE VIRTUAL TABLE fts_content USING fts5(id, title, urls, content='document');

CREATE TRIGGER tgr_fts_content_ai AFTER INSERT ON document BEGIN
    INSERT INTO fts_content(rowid, title) VALUES(new.rowid, new.title);
END;

CREATE TRIGGER tgr_fts_content_ad AFTER DELETE ON document BEGIN
  INSERT INTO fts_content(fts_content, rowid, title) VALUES('delete', old.rowid, old.title);
END;

CREATE TRIGGER trg_fts_content_au AFTER UPDATE ON document BEGIN
  INSERT INTO fts_content(fts_content, rowid, title) VALUES('delete', old.rowid, old.title);
  INSERT INTO fts_content(rowid, title) VALUES(new.rowid, new.title);
END;

-- Create the FTS virtual table for urls and target_urls columns, with custom tokenizer
CREATE VIRTUAL TABLE fts_url USING fts5(id, title, urls, target_urls, content=document);

CREATE TRIGGER tgr_fts_url_ai AFTER INSERT ON document BEGIN
    INSERT INTO fts_url(rowid, urls, target_urls) VALUES (new.rowid, new.urls, new.target_urls);
END;

CREATE TRIGGER tgr_fts_url_ad AFTER DELETE ON document BEGIN
  INSERT INTO fts_url(fts_url, rowid, url, target_urls) VALUES('delete', old.rowid, old.urls, old.target_urls);
END;

CREATE TRIGGER trg_fts_url_au AFTER UPDATE ON document BEGIN
  INSERT INTO fts_url(fts_url, rowid, urls, target_urls) VALUES('delete', old.rowid, old.urls, old.target_urls);
  INSERT INTO fts_url(rowid, urls, target_urls) VALUES (new.rowid, new.urls, new.target_urls);
END;

-- Insert sample data
INSERT INTO document VALUES
  ('id_01', 'https://alpha.com', 'https://bravo-alt.com', 'Apple'),
  ('id_02', 'https://bravo.com https://bravo-alt.com', 'https://charlie.com', 'Apple v2'),
  ('id_03', 'https://delta.com', 'https://alpha.com https://bravo.com', 'Orange'),
  ('id_04', 'https://echo.com https://foxtrot.com', 'https://alpha.com https://charlie.com https://echo.com', 'Orange apple'),
  ('id_05', 'https://golf.com', 'https://charlie.com', 'App center'),
  ('id_06', 'https://hotel.com', 'https://bravo.com https://charlie.com', 'Banana apps');

-- Enable CLI headers
.headers on
.mode box
.separator ROW "\n"
.nullvalue NULL

-- Sample queries

SELECT * FROM document;

SELECT * FROM fts_url;

-- Find inbound nodes to 'id_02'
SELECT * FROM fts_url WHERE target_urls MATCH (
  SELECT REPLACE(urls, ' ', ' OR ') FROM fts_url WHERE id = 'id_02'
) ORDER BY rank;

-- Find outbound nodes from 'id_04'
SELECT * FROM fts_url WHERE urls MATCH (
  SELECT REPLACE(target_urls, ' ', ' OR ') FROM fts_url WHERE id = 'id_04'
) ORDER BY rank;

-- Find nodes who share outbound nodes with 'id_03'
SELECT * FROM fts_url WHERE target_urls MATCH (
  SELECT REPLACE(target_urls, ' ', ' OR ') FROM fts_url WHERE id = 'id_03'
) ORDER BY rank;


SELECT * FROM fts_content;

-- Find nodes with 'apple' in title
SELECT * FROM fts_content WHERE title MATCH 'apple' ORDER BY rank;

-- Find nodes with 'app' in title
SELECT * FROM fts_content WHERE title MATCH 'app' ORDER BY rank;

-- Find nodes with 'app-' prefix in the title
SELECT * FROM fts_content WHERE title MATCH 'app*' ORDER BY rank;

-- Use PRAGMA for migration tracking
PRAGMA user_version;