interface PathOptions {
  exclude?: string[];
  include?: stirng[];
}

interface SearchOptions {
  textQuery?: string;
  paths?: string[];
  limit?: number;
  orderBy?: OrderByOption[];
  direction?: DirectionOption;
  filters?: FilterOption[];
  exclude?: string[];
  include?: stirng[];
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
}
interface GraphNodeOutput<T = any> extends GraphNodeInput {
  data: T;
}

interface GraphNodeLayer {
  get<T = any>(paths: string[]): GraphNodeOutput<T>;
  trackLocal(nodes: GraphNodeInput[]);
  trackRemote(nodes: GraphNodeInput[]);
  getRecent<T = any>(): GraphNodeOutput<T>[];
  search<T = any>(): GraphNodeOutput<T>[];
}
