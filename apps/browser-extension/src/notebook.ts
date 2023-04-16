import { preloadDbWorker } from "./db-worker-proxy";
import { EditorElement } from "./modules/edit/editor-element";
import { OmniboxElement } from "./modules/graph/omnibox/omnibox-element";

const dbWorker = preloadDbWorker();

customElements.define("omnibox-element", OmniboxElement);
customElements.define("editor-element", EditorElement);
