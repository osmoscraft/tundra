export interface GithubConnection {
  owner: string;
  repo: string;
  token: string;
}

export async function saveConnection(connection: GithubConnection) {
  localStorage.setItem("git-connection", JSON.stringify(connection));
}

export async function getConnection(): Promise<GithubConnection | undefined> {
  const connectionStr = localStorage.getItem("git-connection");
  if (!connectionStr) return;
  return JSON.parse(connectionStr);
}
