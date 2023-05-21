export interface DbFile {
  path: string;
  type: string | null;
  content: string;
  createdAt: string; // TODO `createdTime`
  updatedAt: string; // TODO `updatedTime`
}
