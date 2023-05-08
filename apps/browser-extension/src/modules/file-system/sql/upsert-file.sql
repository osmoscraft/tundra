/* upsert */
INSERT INTO File(path, type, content) VALUES (:path, :type, :content)
ON CONFLICT(path) DO UPDATE SET content = :content, type = :type

