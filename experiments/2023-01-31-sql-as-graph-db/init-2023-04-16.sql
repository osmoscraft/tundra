-- Enable CLI headers
.headers on
.mode box
.separator ROW "\n"
.nullvalue NULL


CREATE TABLE IF NOT EXISTS File (
  path       TEXT PRIMARY KEY,
  type       TEXT,
  content    TEXT NOT NULL,
  createdAt  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS FileTimestampTrigger AFTER UPDATE ON File FOR EACH ROW BEGIN
  UPDATE File SET updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE path = old.path;
END;

INSERT INTO File(path, type, content) VALUES
  ('0001.json', 'text/plain', 'content 1'),
  ('0002.json', 'text/plain', 'content 1'),
  ('0003.json', 'text/plain', 'content 1');


SELECT * From File;


UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';
UPDATE File SET content = 'content 2' WHERE path = '0001.json';

SELECT * From File;