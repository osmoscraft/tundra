export interface GithubConnection {
  owner: string;
  repo: string;
  token: string;
}

export function clearGithubConnection() {
  localStorage.removeItem("config.github-connection");
}

export function hasGithubConnection() {
  return !!localStorage.getItem("config.github-connection");
}

export function setGithubConnection(connection: GithubConnection) {
  localStorage.setItem("config.github-connection", JSON.stringify(connection));
}

export function getGithubConnection(): GithubConnection | null {
  const raw = localStorage.getItem("config.github-connection");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

function isEmpty(value: any): value is string {
  return typeof value !== "string" || !value?.length;
}
