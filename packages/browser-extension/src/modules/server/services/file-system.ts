import LightningFS from "@isomorphic-git/lightning-fs";

export class FileSystem {
  public fs = new LightningFS("tinykb-fs");

  constructor() {}

  async ensureRepo(repoName: string) {
    // TODO refactor with recursion
    try {
      const rootStat = await this.fs.promises.stat(`/repos`);
      if (!rootStat.isDirectory()) throw new Error(`/repos is not a dir`);
    } catch (error) {
      if ((error as any)?.code === "ENOENT") {
        await this.fs.promises.mkdir(`/repos/`);
      }
    }
    try {
      const repoStat = await this.fs.promises.stat(`/repos/${repoName}`);
      if (!repoStat.isDirectory()) throw new Error(`/repos/${repoName} is not a dir`);
    } catch (error) {
      if ((error as any)?.code === "ENOENT") {
        await this.fs.promises.mkdir(`/repos/${repoName}`);
      }
    }
  }

  async addFile(repoName: string, path: string, content: string) {
    await this.fs.promises.writeFile(`/repos/${repoName}/${path}`, content);
  }

  async listFiles(repoName: string) {
    const fileNames = await this.fs.promises.readdir(`/repos/${repoName}`);
    // TODO read from metadata index instead
    const files = await Promise.all(fileNames.map((fileName) => this.fs.promises.readFile(`/repos/${repoName}/${fileName}`, { encoding: "utf8" })));

    return files as string[];
  }
}
