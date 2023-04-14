import type { MessageToDbWorker, MessageToMain } from "../../../typings/messages";

export interface DbWorkerContext {
  dbPromise: Promise<Sqlite3.DB>;
  /** Assumption: db file is at the root of the fs */
  dbFilename: string;
  notify: (message: MessageToMain) => any;
  request: (request: MessageToMain) => Promise<MessageToDbWorker>;
  respond: (request: MessageToDbWorker, response: MessageToMain) => any;
}

export type DbWorkerHandler = (context: DbWorkerContext, message: MessageToDbWorker) => any;
