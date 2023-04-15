import type { MessageToDbWorker, MessageToMain } from "../../../typings/messages";
import type { IFileService } from "../../fs";
import type { ISyncService } from "../../sync";

export interface DbWorkerContext {
  fileService: IFileService;
  syncService: ISyncService;
  notify: (message: MessageToMain) => any;
  request: (request: MessageToMain) => Promise<MessageToDbWorker>;
  respond: (request: MessageToDbWorker, response: MessageToMain) => any;
}

export type DbWorkerHandler = (context: DbWorkerContext, message: MessageToDbWorker) => any;
