import LightningFS from "@isomorphic-git/lightning-fs";
// import http from "isomorphic-git/http/web";
import git from "../vendor/isomorphic-git/index.umd.min";
import type { FileSystem } from "./file-system";
import { ObservableFileSystem } from "./observable-file-system";

export class VersionControl {
  private fs = {
    promises: new ObservableFileSystem({
      fsp: new LightningFS("tinykb-fs").promises,
    }),
  };

  constructor(private fileSystem: FileSystem) {}

  async ensureRepo(repoName: string) {
    try {
      await git.log({
        fs: this.fs,
        dir: `/repos/${repoName}`,
      });
    } catch (error) {
      if (error instanceof git.Errors.NotFoundError) {
        git.init({
          fs: this.fs,
          dir: `/repos/${repoName}`,
        });
      } else {
        throw error;
      }
    }

    // await git.clone({
    //   fs,
    //   http,
    //   dir: "/",
    //   url: "https://github.com/chuanqisun/memo",
    //   singleBranch: true,
    //   depth: 1,

    //   onProgress: (progress) => {
    //     console.log(`${progress.phase}: ${progress.loaded}/${progress.total}`);
    //   },

    // const results = await fs.promises.readdir("/");
  }
}
