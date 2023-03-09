export interface GithubConnection {
  owner: string;
  repo: string;
  token: string;
}

export function saveConnection(connection: GithubConnection) {
  localStorage.setItem("git-connection", JSON.stringify(connection));
}

export function getConnection(): GithubConnection | undefined {
  const connectionStr = localStorage.getItem("git-connection");
  if (!connectionStr) return;
  return JSON.parse(connectionStr);
}
