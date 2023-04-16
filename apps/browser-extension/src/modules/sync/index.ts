import { tap } from "@tinykb/fp-utils";
import {
  destoryRootLevelOpfs,
  getRootLevelOpfsFile,
  initWithSchema,
  logInitResult,
  opfsPathToRootFilename,
} from "@tinykb/sqlite-utils";
import type { GithubConnection } from "./github/config-storage";
import type { ZipItem } from "./github/operations/download";
import { downloadZip } from "./github/operations/download";
import { getArchive } from "./github/proxy/get-archive";
import { testConnection } from "./github/proxy/test-connection";
import SCHEMA from "./sql/schema.sql";

export class SyncService {
  private db: Promise<Sqlite3.DB>;

  constructor(private opfsPath: string) {
    this.db = initWithSchema(opfsPath, SCHEMA)
      .then(tap(logInitResult.bind(null, opfsPath)))
      .then((result) => result.db);
  }

  importGithubArchive(connection: GithubConnection, onItem: (item: ZipItem) => any) {
    return getArchive(connection).then((archive) => downloadZip(archive.zipballUrl, onItem));
  }

  testConnection(connection: GithubConnection) {
    return testConnection(connection);
  }

  async destory() {
    await this.db;
    return destoryRootLevelOpfs(opfsPathToRootFilename(this.opfsPath));
  }

  async getOpfsFile() {
    await this.db;
    return getRootLevelOpfsFile(opfsPathToRootFilename(this.opfsPath));
  }
}

export type ISyncService = Pick<SyncService, keyof SyncService>;
