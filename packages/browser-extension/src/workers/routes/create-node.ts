import type { RequestHandler } from "../../lib/worker-ipc/proxy-server";

export interface CreateNodeInput {
  mediaType: "application/json"; // With potential extensibility to html, yaml, markdown, plaintext
  content: string;
}

export interface CreateNodeOutput {
  id: string;
}
export const handleCreateNode: RequestHandler<CreateNodeInput, CreateNodeOutput> = async ({ input }) => {
  const id = crypto.randomUUID();

  // await context.fileSystem.addFile(tempRepoName, `${id}.json`, input.content);

  return {
    id,
  };
};
