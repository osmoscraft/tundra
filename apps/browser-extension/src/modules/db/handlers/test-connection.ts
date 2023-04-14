import { testConnection } from "../../sync/github/operations/test-connection";
import type { DbWorkerHandler } from "./base";

export const handleRequestTestConnection: DbWorkerHandler = async (context, message) => {
  if (!message.requestTestConnection) return;

  const result = await testConnection(message.requestTestConnection);

  context.respond(message, { respondTestConnection: result });
};
