export interface DbFile {
  path: string;
  type: "text/markdown"; // TODO, support more types in the future
  content: string;
  createdTime: string;
  updatedTime: string;
}
