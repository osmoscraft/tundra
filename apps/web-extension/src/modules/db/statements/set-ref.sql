INSERT INTO ref(type, id) VALUES (:type, :id) ON CONFLICT DO 
UPDATE SET id = :id WHERE type = :type;