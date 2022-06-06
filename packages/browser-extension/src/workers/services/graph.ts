import type { ObservableFileSystem } from "./observable-file-system";

export interface GraphNode {
  id: string;
  [key: string]: any;
}

export interface GraphConfig {
  fs: ObservableFileSystem;
}
export class Graph {
  constructor(private config: GraphConfig) {
    config.fs.init("tinykb-fs");
  }

  async ensureRepo(repoName: string) {
    // TODO refactor with recursion, ensureDir
    try {
      const rootStat = await this.config.fs.stat(`/repos`);
      if (!rootStat.isDirectory()) throw new Error(`/repos is not a dir`);
    } catch (error) {
      if ((error as any)?.code === "ENOENT") {
        await this.config.fs.mkdir(`/repos/`);
      }
    }
    try {
      const repoStat = await this.config.fs.stat(`/repos/${repoName}`);
      if (!repoStat.isDirectory()) throw new Error(`/repos/${repoName} is not a dir`);
    } catch (error) {
      if ((error as any)?.code === "ENOENT") {
        await this.config.fs.mkdir(`/repos/${repoName}`);
      }
    }
  }

  async writeNode(id: string, content: string) {
    await this.ensureRepo(`repo-01`);
    await this.config.fs.writeFile(`/repos/repo-01/${id}.json`, content);
  }

  async listNodes() {
    await this.ensureRepo(`repo-01`);
    const nodeFiles = await this.config.fs.readdir(`/repos/repo-01`);
    const files = await Promise.all(nodeFiles.map((file) => this.config.fs.readFile(`/repos/repo-01/${file}`, { encoding: "utf8" })));
    const nodes = files.map((file) => JSON.parse(file as string));

    return nodes;
  }
}
