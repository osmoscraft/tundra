-- TODO auto generate base meta with timestamp
INSERT INTO node(path, content) VALUES (:path, :content) ON CONFLICT DO 
UPDATE SET content = :content WHERE path = :path;