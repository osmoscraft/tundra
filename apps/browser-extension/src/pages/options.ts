import { client, dedicatedWorkerHostPort } from "@tinykb/rpc-utils";
import { preloadDbWorker } from "../db-worker-proxy";
import { DevtoolElement } from "../modules/devtool/devtool-element";
import { FsExplorerElement } from "../modules/fs/explorer/fs-explorer-element";
import { GithubConfigElement } from "../modules/sync-v2/github/github-config-element";
import type { DataWorkerRoutes } from "../workers/data-worker";

const worker = new Worker("./data-worker.js", { type: "module" });

const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });

function staticDependencies(ctor: any, deps: any) {
  ctor.dependencies = deps;
  return ctor;
}

preloadDbWorker();

customElements.define("devtool-element", staticDependencies(DevtoolElement, { proxy }));
customElements.define("github-config-element", staticDependencies(GithubConfigElement, { proxy }));
customElements.define("fs-explorer-element", FsExplorerElement);
