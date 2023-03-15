-- urlList: each URL should be surrounded by quotes and joined by OR. e.g. `"http://example.com/1" OR "http://example.com/2"`
SELECT * FROM node_fts WHERE links MATCH :urlList ORDER BY rank;