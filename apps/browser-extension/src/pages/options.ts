import { client, dedicatedWorkerHostPort } from "@tinykb/rpc-utils";
import { preloadDbWorker } from "../db-worker-proxy";
import { DevtoolElement } from "../modules/devtool/devtool-element";
import { FsExplorerElement } from "../modules/fs/explorer/fs-explorer-element";
import { GithubConfigElement } from "../modules/sync/github/github-config-element";
import type { DataWorkerRoutes } from "../workers/data-worker";

const worker = new Worker("./data-worker.js", { type: "module" });

const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });

DevtoolElement.dependencies = {
  proxy,
};

preloadDbWorker();

customElements.define("devtool-element", DevtoolElement);
customElements.define("github-config-element", GithubConfigElement);
customElements.define("fs-explorer-element", FsExplorerElement);
