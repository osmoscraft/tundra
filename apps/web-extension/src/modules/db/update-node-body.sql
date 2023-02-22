-- TODO auto patch timestamp
UPDATE node SET body = :body WHERE id = :id;