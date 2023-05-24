INSERT INTO FileChange(path, localHashTime, localHash, remoteHashTime, remoteHash) VALUES (:path, NULL, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), :remoteHash)
ON CONFLICT(path) DO UPDATE SET remoteHashTime = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), remoteHash = :remoteHash