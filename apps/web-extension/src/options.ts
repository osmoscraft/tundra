import { DbConfigElement } from "./modules/db/db-config-element";
import { GithubConfigElement } from "./modules/sync/github/github-config-element";
import { WorkerTerminalElement } from "./modules/worker/worker-terminal-element";

import "./styles/global.css";

customElements.define("worker-terminal-element", WorkerTerminalElement);
customElements.define("github-config-element", GithubConfigElement);
customElements.define("db-config-element", DbConfigElement);

export default function main() {
  console.log("hello options");
}

main();
