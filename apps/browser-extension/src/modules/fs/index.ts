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

  async write(path: string, type: string, content: string) {
    const db = await this.db;
    const oldFile = await this.read(path);

    this.dispatchEvent(
      new CustomEvent<PreWriteInit>("prewrite", {
        detail: { oldFile, newFile: { path, type, content } },
      })
    );

    db.exec(INSERT_FILE, {
      bind: {
        ":path": path,
        ":type": type,
        ":content": content,
      },
    });

    const newFile = await this.read(path);

    this.dispatchEvent(
      new CustomEvent<PostWriteInit>("postwrite", {
        detail: { oldFile, newFile },
      })
    );

    return;
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

export interface PreWriteInit {
  oldFile?: TinyFile;
  newFile?: Omit<TinyFile, "createdAt" | "updatedAt">;
}
export interface PostWriteInit {
  oldFile?: TinyFile;
  newFile?: TinyFile;
}

export interface TinyFile {
  path: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}
