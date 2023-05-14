import { staticDependencies } from "@tinykb/dom-utils";
import { client, dedicatedWorkerHostPort } from "@tinykb/rpc-utils";
import { FileSystemExplorerElement } from "../modules/file-system/explorer/file-system-explorer-element";
import type { DataWorkerRoutes } from "../workers/data-worker";

const worker = new Worker("./data-worker.js", { type: "module" });

const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });

FileSystemExplorerElement.dependencies = { proxy };
customElements.define("file-system-explorer-element", staticDependencies(FileSystemExplorerElement, { proxy }));
