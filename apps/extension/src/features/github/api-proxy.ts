export function apiV3<T>(init: RequestInit, url: string) {
  return fetch(url, init).then((res) => res.json()) as Promise<T>;
}

export function apiV4<TInput = undefined, TOutput = any>(
  context: { owner: string; token: string },
  query: string,
  ...args: TInput extends undefined ? [] : [variables: TInput]
): Promise<{ data: TOutput; errors?: any[] }> {
  return fetch("https://api.github.com/graphql", {
    ...getGitHubInit(context),
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

export function getGitHubInit(context: { owner: string; token: string }): RequestInit {
  return {
    headers: new Headers({
      Authorization: "Basic " + (btoa as Window["btoa"])(`${context.owner}:${context.token}`),
      "Content-Type": "application/json",
    }),
  };
}
