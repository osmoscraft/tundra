import { staticDependencies } from "@tundra/dom-utils";
import { client, dedicatedWorkerHostPort, server } from "@tundra/rpc-utils";
import { DevtoolElement } from "../modules/devtool/devtool-element";
import { FileSystemReadonlyExplorerElement } from "../modules/devtool/file-system-readonly-explorer-element";
import { GithubConfigElement } from "../modules/sync/github/github-config-element";
import type { DataWorkerRoutes } from "../workers/data-worker";
import "./options.css";

const worker = new Worker("./data-worker.js", { type: "module" });

server({ routes: {}, port: dedicatedWorkerHostPort(worker) });

const { proxy } = client<DataWorkerRoutes>({ port: dedicatedWorkerHostPort(worker) });

customElements.define("devtool-element", staticDependencies(DevtoolElement, { proxy }));
customElements.define("github-config-element", staticDependencies(GithubConfigElement, { proxy }));
customElements.define(
  "file-system-readonly-explorer-element",
  staticDependencies(FileSystemReadonlyExplorerElement, { proxy })
);
