import { tap } from "@tinykb/fp-utils";
import {
  destoryRootLevelOpfs,
  getRootLevelOpfsFile,
  initWithSchema,
  logInitResult,
  opfsPathToRootFilename,
} from "@tinykb/sqlite-utils";
import INSERT_FILE from "./sql/insert-file.sql";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";

export class FileService implements IFileService {
  private db: Promise<Sqlite3.DB>;

  constructor(private opfsPath: string) {
    this.db = initWithSchema(opfsPath, SCHEMA)
      .then(tap(logInitResult.bind(null, opfsPath)))
      .then((result) => result.db);
  }

  async writeText(path: string, content: string) {
    return (await this.db).exec(INSERT_FILE, {
      bind: {
        ":path": path,
        ":type": "text/plain",
        ":content": content,
      },
    });
  }

  async read(path: string) {
    return (await this.db).selectObject<TinyFile>(SELECT_FILE, {
      ":path": path,
    });
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

export type IFileService = Pick<FileService, keyof FileService>;

export interface TinyFile {
  path: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}
