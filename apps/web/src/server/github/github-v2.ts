import getTreeQuery from "./graphql/get-tree.graphql?raw";

export const getTreeOidByPath = async (context: GitHubContext, path: string) =>
  gqlFetch(context, getTreeQuery, {
    repo: context.repo,
    owner: context.owner,
    path,
  })
    .then(throwFirstGraphQLError)
    .then((data) => data.repository.defaultBranchRef.target.file.object.oid as string);

export const listTree = async (context: GitHubContext, treeOid: string, recursive?: boolean) => {
  return;
};

// TODO refactor below to utils

export interface GitHubContext {
  owner: string;
  repo: string;
  token: string;
}

export function jsonFetch<T>(init: RequestInit, url: string) {
  return fetch(url, init).then((res) => res.json()) as Promise<T>;
}

export function gqlFetch<TInput = any, TOutput = any>(
  context: { owner: string; token: string },
  query: string,
  input?: TInput
): Promise<{ data: TOutput; errors?: any[] }> {
  return fetch("https://api.github.com/graphql", {
    ...getGitHubInit(context),
    method: "POST",
    body: JSON.stringify({
      query,
      variables: input,
    }),
  }).then((res) => res.json());
}

export function throwFirstGraphQLError<T = any>(maybeErrors: { data: T; errors?: any[] }) {
  if (maybeErrors.errors?.length) throw maybeErrors.errors[0];
  return maybeErrors.data;
}

export function getGitHubInit(context: { owner: string; token: string }): RequestInit {
  return {
    headers: new Headers({
      Authorization: "Basic " + btoa(`${context.owner}:${context.token}`),
      "Content-Type": "application/json",
    }),
  };
}
