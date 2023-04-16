import { tap } from "@tinykb/fp-utils";
import { destoryOpfsByPath, getOpfsFileByPath, initWithSchema, logInitResult } from "@tinykb/sqlite-utils";
import type { ZipItem } from "./github/operations/download";
import { downloadZip } from "./github/operations/download";
import { getArchive } from "./github/proxy/get-archive";
import { testConnection } from "./github/proxy/test-connection";
import CLEAR_DB from "./sql/clear-db.sql";
import CLEAR_HISTORY from "./sql/clear-history.sql";
import REPLACE_GITHUB_CONNECTION from "./sql/replace-github-connection.sql";
import REPLACE_GITHUB_REF from "./sql/replace-github-ref.sql";
import SCHEMA from "./sql/schema.sql";
import SELECT_GITHUB_CONNECTION from "./sql/select-github-connection.sql";

export class SyncService {
  private db: Promise<Sqlite3.DB>;

  constructor(private opfsPath: string) {
    this.db = initWithSchema(opfsPath, SCHEMA)
      .then(tap(logInitResult.bind(null, opfsPath)))
      .then((result) => result.db);
  }

  async *importGithubArchive(): AsyncGenerator<ZipItem> {
    const connection = await this.getConnection();
    if (!connection) throw new Error("Missing connection");
    const archive = await getArchive(connection);
    const itemsGenerator = downloadZip(archive.zipballUrl);

    yield* itemsGenerator;

    await this.setGithubRef(archive.oid);
  }

  private async setGithubRef(id: string) {
    return (await this.db).exec(REPLACE_GITHUB_REF, {
      bind: { ":id": id },
    });
  }

  async setConnection(connection: GithubConnection) {
    return (await this.db).exec(REPLACE_GITHUB_CONNECTION, {
      bind: {
        ":owner": connection.owner,
        ":repo": connection.repo,
        ":token": connection.token,
      },
    });
  }

  async testConnection() {
    const connection = await this.getConnection();
    return !!connection && testConnection(connection);
  }

  async getConnection() {
    return (await this.db).selectObject<GithubConnection>(SELECT_GITHUB_CONNECTION) ?? null;
  }

  async clear() {
    return (await this.db).exec(CLEAR_DB);
  }

  async clearHistory() {
    return (await this.db).exec(CLEAR_HISTORY);
  }

  async destory() {
    await this.db;
    await destoryOpfsByPath(this.opfsPath);
  }

  async getOpfsFile() {
    await this.db;
    return getOpfsFileByPath(this.opfsPath);
  }
}

export type ISyncService = Pick<SyncService, keyof SyncService>;
export interface GithubConnection {
  owner: string;
  repo: string;
  token: string;
}
