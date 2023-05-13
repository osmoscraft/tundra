export * from "./proxy/api-connection";
export * from "./proxy/get-archive";
export * from "./proxy/test-connection";

export interface GithubConnection {
  owner: string;
  repo: string;
  token: string;
}
