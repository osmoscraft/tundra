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

export function getGithubConnection(): GithubConnection {
  const raw = localStorage.getItem("config.github-connection");
  if (!raw) return INITIAL_CONNECTION;

  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONNECTION;
  }
}

const INITIAL_CONNECTION: GithubConnection = {
  owner: "",
  repo: "",
  token: "",
};
