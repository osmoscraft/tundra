export interface GithubAuth {
  owner: string;
  token: string;
}

export function apiV3<T>(auth: GithubAuth, path: string, init?: RequestInit) {
  return fetch(`https://api.github.com${path}`, { ...getGithubInit(auth), ...init }).then((res) =>
    res.json()
  ) as Promise<T>;
}

export function apiV4<TInput = undefined, TOutput = any>(
  auth: GithubAuth,
  query: string,
  ...args: TInput extends undefined ? [] : [variables: TInput]
): Promise<{ data: TOutput; errors?: any[] }> {
  return fetch("https://api.github.com/graphql", {
    ...getGithubInit(auth),
    method: "POST",
    body: JSON.stringify({
      query,
      variables: args[0],
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP Error Code ${res.status}`);
      return res.json();
    })
    .catch((error) => ({ data: null, errors: [error] }));
}

export function unwrap<T = any>(maybeErrors: { data: T; errors?: any[] }) {
  if (maybeErrors.errors?.length) throw maybeErrors.errors[0];
  return maybeErrors.data;
}

export function getGithubInit(auth: GithubAuth): RequestInit {
  return {
    headers: new Headers({
      Authorization: "Basic " + (btoa as Window["btoa"])(`${auth.owner}:${auth.token}`),
      "Content-Type": "application/json",
    }),
  };
}
