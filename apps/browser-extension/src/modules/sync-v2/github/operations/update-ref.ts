import type { GithubConnection } from "..";
import type { ObjectType } from "./types";

export interface UpdateRefInput {
  ref: string;
  sha: string;
  force?: boolean;
}

export interface Ref {
  ref: string;
  object: {
    type: ObjectType;
    sha: string;
  };
}

export async function updateRef(context: GithubConnection, input: UpdateRefInput): Promise<Ref> {
  const { token, owner, repo } = context;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/${input.ref}`, {
    headers: new Headers({
      Authorization: "Basic " + self.btoa(`${owner}:${token}`),
      "Content-Type": "application/json",
    }),
    method: "PATCH",
    body: JSON.stringify({
      sha: input.sha,
      force: input.force,
    }),
  });

  return await response.json();
}
