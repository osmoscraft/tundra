-- TODO auto patch timestamp
-- TODO update change status
UPDATE node SET body = :body WHERE id = :id;