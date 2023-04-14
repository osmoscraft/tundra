import { DbDevtoolElement } from "./modules/db/devtool/db-devtool-element";
import { preloadDbWorker } from "./modules/db/proxy";
import { GithubConfigElement } from "./modules/sync/github/github-config-element";

preloadDbWorker();
customElements.define("db-devtool-element", DbDevtoolElement);
customElements.define("github-config-element", GithubConfigElement);
