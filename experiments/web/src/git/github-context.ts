export interface GitHubContext {
  owner: string;
  repo: string;
  token: string;
}

export async function getGitHubContext(): Promise<GitHubContext | null> {
  const data: GitHubContext = JSON.parse(localStorage.getItem("gh-connection") ?? "{}");
  const { owner, repo, token } = data;
  if (!owner || !repo || !token) return null;

  return data;
}

export async function setGitHubContext(account: GitHubContext) {
  if (!account.owner || !account.repo || !account.token) throw new Error("Invalid account object");

  localStorage.setItem("gh-connection", JSON.stringify(account));
}
