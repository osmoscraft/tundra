/* upsert */
INSERT INTO File(path, content) VALUES (:path, :content)
ON CONFLICT(path) DO UPDATE SET content = :content

