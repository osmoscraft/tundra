import { tap } from "@tinykb/fp-utils";
import { destoryOpfsByPath, getOpfsFileByPath, initWithSchema, logInitResult } from "@tinykb/sqlite-utils";
import CLEAR_DB from "./sql/clear-db.sql";
import INSERT_FILE from "./sql/insert-file.sql";
import LIST_FILES from "./sql/list-files.sql";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";

export class FileService extends EventTarget implements IFileService {
  private db: Promise<Sqlite3.DB>;

  constructor(private opfsPath: string) {
    super();
    this.db = initWithSchema(opfsPath, SCHEMA)
      .then(tap(logInitResult.bind(null, opfsPath)))
      .then((result) => result.db);
  }

  async writeText(path: string, content: string) {
    const db = await this.db;

    const result = db.exec(INSERT_FILE, {
      bind: {
        ":path": path,
        ":type": "text/plain",
        ":content": content,
      },
    });

    this.dispatchEvent(
      new CustomEvent<AfterWriteInit>("afterwrite", {
        detail: { newValue: { path, type: "text/plain", content } },
      })
    );

    return result;
  }

  async read(path: string) {
    return (await this.db).selectObject<TinyFile>(SELECT_FILE, {
      ":path": path,
    });
  }

  async clear() {
    return (await this.db).exec(CLEAR_DB);
  }

  async destory() {
    await this.db;
    return destoryOpfsByPath(this.opfsPath);
  }

  async getOpfsFile() {
    await this.db;
    return getOpfsFileByPath(this.opfsPath);
  }

  async list(limit: number, offset: number) {
    return (await this.db).selectObjects<TinyFile>(LIST_FILES, {
      ":limit": limit,
      ":offset": offset,
    });
  }
}

export type IFileService = Pick<FileService, keyof FileService>;

export interface AfterWriteInit {
  newValue: Omit<TinyFile, "createdAt" | "updatedAt">;
}

export interface TinyFile {
  path: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}
