import LightningFS from "@isomorphic-git/lightning-fs";
import { ObservableFileSystem } from "./observable-file-system";

export class FileSystem {
  public fs = new ObservableFileSystem({
    fsp: new LightningFS().promises,
    onChange: (record) => {
      console.log(record);
    },
  });

  constructor() {
    this.fs.init("tinykb-fs");
  }

  async ensureRepo(repoName: string) {
    // TODO refactor with recursion
    // TODO push down fs level operations into Observable FS class
    try {
      const rootStat = await this.fs.stat(`/repos`);
      if (!rootStat.isDirectory()) throw new Error(`/repos is not a dir`);
    } catch (error) {
      if ((error as any)?.code === "ENOENT") {
        await this.fs.mkdir(`/repos/`);
      }
    }
    try {
      const repoStat = await this.fs.stat(`/repos/${repoName}`);
      if (!repoStat.isDirectory()) throw new Error(`/repos/${repoName} is not a dir`);
    } catch (error) {
      if ((error as any)?.code === "ENOENT") {
        await this.fs.mkdir(`/repos/${repoName}`);
      }
    }
  }

  async addFile(repoName: string, path: string, content: string) {
    await this.fs.writeFile(`/repos/${repoName}/${path}`, content);
  }

  async listFiles(repoName: string) {
    const fileNames = await this.fs.readdir(`/repos/${repoName}`);
    // TODO read from metadata index instead
    const files = await Promise.all(fileNames.map((fileName) => this.fs.readFile(`/repos/${repoName}/${fileName}`, { encoding: "utf8" })));

    return files as string[];
  }
}
