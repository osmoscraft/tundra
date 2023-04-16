import { pipe, tap } from "@tinykb/fp-utils";
import { getLibversion, loadApiIndex, openOpfsDb } from "@tinykb/sqlite-loader";
import INSERT_FILE from "./sql/insert-file.sql";
import SCHEMA from "./sql/schema.sql";
import SELECT_FILE from "./sql/select-file.sql";

export type IFileService = Pick<FileService, keyof FileService>;
export class FileService implements IFileService {
  private db: Promise<Sqlite3.DB>;

  constructor(private opfsPath: string) {
    this.db = init(this.opfsPath);
  }

  async writeText(path: string, content: string) {
    return writeTextFile(await this.db, path, content);
  }

  async read(path: string) {
    return readFile(await this.db, path);
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

export interface TinyFile {
  path: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

function init(opfsPath: string) {
  return Promise.resolve(mark("db-init-start"))
    .then(() => loadApiIndex("./sqlite3/jswasm/"))
    .then(
      pipe(
        tap(pipe(getLibversion, (v: string) => console.log(`[db] ${opfsPath} version: ${v}`))),
        openOpfsDb.bind(null, opfsPath),
        (db: Sqlite3.DB) => db.exec(SCHEMA)
      )
    )
    .then(tap(pipe(measure.bind(null, "db-init-start"), logDuration.bind(null, `[perf] ${opfsPath} schema init`))));
}

function writeTextFile(db: Sqlite3.DB, filePath: string, content: string) {
  db.exec(INSERT_FILE, {
    bind: {
      ":path": filePath,
      ":type": "text/plain",
      ":content": content,
    },
  });
}

function readFile(db: Sqlite3.DB, filePath: string) {
  return db.selectObject<TinyFile>(SELECT_FILE, {
    ":path": filePath,
  });
}

function logDuration(name: string, measure: PerformanceMeasure) {
  console.log(`${name} ${measure.duration.toFixed(2)}ms`);
}

function mark(markName: string) {
  return performance.mark(markName);
}
function measure(markName: string) {
  return performance.measure("", markName);
}

async function destoryRootLevelOpfs(filename: string) {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(filename);
}
async function getRootLevelOpfsFile(filename: string) {
  const root = await navigator.storage.getDirectory();
  const dbFileHandle = await root.getFileHandle(filename);
  const file = await dbFileHandle.getFile();
  return file;
}

function opfsPathToRootFilename(opfsPath: string) {
  const [empty, filename, ...emptyList] = opfsPath.split("/");
  if (empty || emptyList.length) {
    throw new Error(`Invalid opfsPath "${opfsPath}". It must be in the format "/filename"`);
  }

  return filename;
}
