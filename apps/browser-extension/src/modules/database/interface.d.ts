interface PathOptions {
  exclude?: string[];
  include?: stirng[];
}

interface ListOptions {
  paths?: string[];
  limit?: number;
  orderBy?: OrderByOption[];
  direction?: DirectionOption;
  filters?: FilterOption[];
  exclude?: string[];
  include?: stirng[];
}

interface SearchOptions extends ListOptions {
  query: string;
}

type OrderByOption = "path" | "updatedAt";
type DirectionOption = "ASC" | "DESC";
type FilterOption = "isDirty" | "isDeleted";

interface FileWrite {
  path: string;
  data: string | null;
  localContent?: string | null;
  localUpdatedAt?: number;
  remoteContent?: string | null;
  remoteUpdatedAt?: number;
}

interface FsLayer {
  read(globs: string[], options?: PathOptions);
  delete(globs: string[], options?: PathOptions);
  write(files: FileWrite[]);
  search(options?: SearchOptions);
}

interface GraphNodeInput {
  path: string;
  content: string;
  updatedAt?: number;
}
interface GraphNodeOutput<T = any> extends GraphNodeInput {
  data: T;
}

interface GraphNodeLayer {
  commit(nodes: GraphNodeInput[]);
  clone(nodes: GraphNodeInput[]);
  pull(nodes: GraphNodeInput[]);
  push(nodes: GraphNodeInput[]);
  list<T = any>(paths: string[], options: ListOptions): GraphNodeOutput<T>[];
  search<T = any>(options: SearchOptions): GraphNodeOutput<T>[];
}
