DELETE FROM GithubConnection;
DELETE FROM GithubRef;
INSERT INTO GithubConnection(owner, repo, token) VALUES (:owner, :repo, :token);