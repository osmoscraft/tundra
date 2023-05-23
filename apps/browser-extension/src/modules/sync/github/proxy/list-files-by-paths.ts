import type { GithubConnection } from "..";
import { listFilesByPathsGraphql } from "../queries/list-files-by-paths-graph";
import { apiV4, unwrap } from "./api-connection";

export interface ListFilesOutput {
  repository: {
    defaultBranchRef: {
      target: {
        oid: string;
        [key: `file${number}`]: FileContainer;
      };
    };
  };
}

export interface FileContainer {
  nodes: {
    committedDate: string;
    file: {
      object: {
        text: string;
      };
    };
  }[];
}

export interface ListFilesVariables {
  owner: string;
  repo: string;
  [key: `path${number}`]: string;
}

export interface ListFilesResult {
  oid: string;
  files: {
    path: string;
    committedDate: string;
    content: string;
  }[];
}
export async function listFilesByPaths(connection: GithubConnection, paths: string[]): Promise<ListFilesResult> {
  const query = listFilesByPathsGraphql(paths.length);
  const variables: ListFilesVariables = {
    ...connection,
    ...Object.fromEntries(paths.map((path, index) => [`path${index}`, path])),
  };

  const response = await apiV4<ListFilesVariables, ListFilesOutput>(connection, query, variables);
  const data = unwrap(response);

  const oid = data.repository.defaultBranchRef.target.oid;
  const files = Object.entries(data.repository.defaultBranchRef.target)
    .filter(isFileContainer)
    .map(([key, value], index) => ({
      path: paths[index],
      committedDate: value.nodes[0].committedDate,
      content: value.nodes[0].file.object.text,
    }));

  return { oid, files };
}

type KeyVal = [string, any];
type KeyFileContainer = [string, FileContainer];
function isFileContainer(kv: KeyVal): kv is KeyFileContainer {
  return kv[0].startsWith("file");
}
