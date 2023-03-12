export const enum ObjectMode {
  File = "100644",
  Executable = "100755",
  Sudirectory = "040000",
  Submodule = "160000",
  Symlink = "120000",
}

export const enum ObjectType {
  Blob = "blob",
  Tree = "tree",
  Commit = "commit",
}

export interface Commit {
  sha: string;
  tree: {
    sha: string;
  };
}

export interface Tree {
  sha: string;
  tree: {
    path: string;
    sha: string;
    type: string;
    mode: string;
  }[];
}
