import { preloadDbWorker } from "../db-worker-proxy";
import { DbDevtoolElement } from "../modules/devtool/db-devtool-element";
import { FsExplorerElement } from "../modules/fs/explorer/fs-explorer-element";
import { GithubConfigElement } from "../modules/sync/github/github-config-element";

preloadDbWorker();

customElements.define("db-devtool-element", DbDevtoolElement);
customElements.define("github-config-element", GithubConfigElement);
customElements.define("fs-explorer-element", FsExplorerElement);
