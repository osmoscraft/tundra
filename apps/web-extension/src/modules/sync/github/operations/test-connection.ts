import { apiV4, unwrap } from "../api-proxy";
import type { GithubConnection } from "../config-storage";
import TEST_CONNECTION from "../queries/test-connection.graphql";

export interface TestConnectionOutput {
  viewer: {
    login: string;
  };
}
export async function testConnection(connection: GithubConnection) {
  try {
    const response = await apiV4<undefined, TestConnectionOutput>(connection, TEST_CONNECTION);
    const data = unwrap(response);
    const login = data.viewer.login;
    console.log(`Successfully logged in as "${login}"`);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}
