import type { MessageToDbWorker, MessageToMain } from "../../../typings/messages";
import type { ITinyFS } from "../../tiny-fs";

export interface DbWorkerContext {
  tinyFS: ITinyFS;
  notify: (message: MessageToMain) => any;
  request: (request: MessageToMain) => Promise<MessageToDbWorker>;
  respond: (request: MessageToDbWorker, response: MessageToMain) => any;
}

export type DbWorkerHandler = (context: DbWorkerContext, message: MessageToDbWorker) => any;
