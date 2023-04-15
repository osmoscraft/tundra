import { preloadDbWorker } from "./db-worker-proxy";
import { GithubConfigElement } from "./modules/sync/github/github-config-element";
import { DbDevtoolElement } from "./modules/worker/devtool/db-devtool-element";

preloadDbWorker();
customElements.define("db-devtool-element", DbDevtoolElement);
customElements.define("github-config-element", GithubConfigElement);
