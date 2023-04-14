import { DbDevtoolElement } from "./modules/db/devtool/db-devtool-element";
import { getDbWorker } from "./modules/db/get-db-worker";
import { GithubConfigElement } from "./modules/sync/github/github-config-element";

getDbWorker();
customElements.define("db-devtool-element", DbDevtoolElement);
customElements.define("github-config-element", GithubConfigElement);
