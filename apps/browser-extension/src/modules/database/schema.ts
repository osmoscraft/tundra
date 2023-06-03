export interface DbFile {
  path: string;
  content: string | null;
  updatedTime: number;
  localHash: string | null;
  remoteHash: string | null;
  isDirty: boolean;
}
