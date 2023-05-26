export interface RemoteChangeRecord {
  path: string;
  status: RemoteChangeStatus;
  readText: () => string | null | Promise<string | null>;
  readTimestamp: () => string | Promise<string>;
}

export enum RemoteChangeStatus {
  Created = 1,
  Updated = 2,
  Deleted = 3,
}

export function isMarkdownFile(record: RemoteChangeRecord) {
  return record.path.endsWith(".md");
}
