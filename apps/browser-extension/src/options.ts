import { DbDevtoolElement } from "./modules/db/devtool/db-devtool-element";
import { getDbWorker } from "./modules/db/get-instance";
import "./options.css";

getDbWorker();
customElements.define("db-devtool-element", DbDevtoolElement);
