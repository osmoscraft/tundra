import LightningFS from "@isomorphic-git/lightning-fs";
// import http from "isomorphic-git/http/web";
import git from "../lib/isomorphic-git/index.umd.min";

export class GitService {
  private fs = new LightningFS("tinykb-fs");
  constructor() {}

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

  async addFile(repoName: string, path: string, content: any) {
    return git.add({
      fs: this.fs,
      dir: `/repos/${repoName}`,
      filepath: path,
    });
  }
}
