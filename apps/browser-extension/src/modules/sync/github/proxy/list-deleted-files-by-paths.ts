import type { GithubConnection } from "..";
import { listDeletedFilesByPathsGraphql } from "../queries/list-deleted-files-by-paths-graphql";
import { apiV4, unwrap } from "./api-connection";

export interface ListDeletedFilesOutput {
  repository: {
    defaultBranchRef: {
      target: {
        oid: string;
        [key: `file${number}`]: DeletedFileContainer;
      };
    };
  };
}

export interface DeletedFileContainer {
  nodes: {
    committedDate: string;
    file: null;
  }[];
}

export interface ListDeletedFilesVariables {
  owner: string;
  repo: string;
  [key: `path${number}`]: string;
}

export interface ListDeletedFilesResult {
  oid: string;
  files: {
    path: string;
    committedDate: string;
    content: null;
  }[];
}
export async function listDeletedFilesByPaths(
  connection: GithubConnection,
  paths: string[]
): Promise<ListDeletedFilesResult> {
  const query = listDeletedFilesByPathsGraphql(paths.length);
  const variables: ListDeletedFilesVariables = {
    ...connection,
    ...Object.fromEntries(paths.map((path, index) => [`path${index}`, path])),
  };

  const response = await apiV4<ListDeletedFilesVariables, ListDeletedFilesOutput>(connection, query, variables);
  const data = unwrap(response);

  const oid = data.repository.defaultBranchRef.target.oid;
  const files = Object.entries(data.repository.defaultBranchRef.target)
    .filter(isFileContainer)
    .map(([key, value], index) => ({
      path: paths[index],
      committedDate: value.nodes[0].committedDate,
      content: null,
    }));

  return { oid, files };
}

type KeyVal = [string, any];
type KeyFileContainer = [string, DeletedFileContainer];
function isFileContainer(kv: KeyVal): kv is KeyFileContainer {
  return kv[0].startsWith("file");
}
