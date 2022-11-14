import type { Logger } from "../log";
import { apiV4, unwrap } from "./api-proxy";
import TEST_CONNECTION from "./queries/test-connection.graphql";

export interface GitHubConnection {
  owner: string;
  repo: string;
  token: string;
}

export interface TestConnection {
  viewer: {
    login: string;
  };
}
export async function testConnection(logger: Logger, connection: GitHubConnection) {
  const response = await apiV4<undefined, TestConnection>(connection, TEST_CONNECTION);
  try {
    const data = unwrap(response);
    const login = data?.viewer?.login;
    if (!login) {
      logger.error(`Error getting user login info`);
      return false;
    }

    logger.info(`Successfully logged in as "${login}"`);
    return true;
  } catch (error: any) {
    logger.error(`${error?.name ?? "Unknown error"}: ${error?.message ?? "unknown details"}`);
  }
}
