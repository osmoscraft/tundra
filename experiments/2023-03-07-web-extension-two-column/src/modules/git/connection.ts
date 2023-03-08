import type { GitHubConnection } from "./github/operations";

export function formToConnection(form: HTMLFormElement): GitHubConnection {
  const formData = new FormData(form);
  return {
    repo: formData.get("repo") as string,
    owner: formData.get("owner") as string,
    token: formData.get("token") as string,
  };
}

export function connectionToForm(connection: Partial<GitHubConnection>, form: HTMLFormElement) {
  if (connection.repo) {
    form.querySelector<HTMLInputElement>(`[name="repo"]`)!.value = connection.repo;
  }

  if (connection.owner) {
    form.querySelector<HTMLInputElement>(`[name="owner"]`)!.value = connection.owner;
  }

  if (connection.token) {
    form.querySelector<HTMLInputElement>(`[name="token"]`)!.value = connection.token;
  }
}

export function saveConnection(connection: GitHubConnection) {
  localStorage.setItem("git-connection", JSON.stringify(connection));
}

export function getConnection(): GitHubConnection | undefined {
  const connectionStr = localStorage.getItem("git-connection");
  if (!connectionStr) return;
  return JSON.parse(connectionStr);
}
