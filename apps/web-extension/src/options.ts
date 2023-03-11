import { DbConfigElement } from "./modules/db/db-config-element";
import { EditorElement } from "./modules/editor/editor-element";
import { OmniboxElement, OpenEventDetail, QueryEventDetail } from "./modules/search/omnibox-element";
import { GithubConfigElement } from "./modules/sync/github/github-config-element";
import { loadWorker } from "./modules/worker/load-worker";
import { getNotifier, getRequester } from "./modules/worker/notify";
import { WorkerTerminalElement } from "./modules/worker/worker-terminal-element";

import "./styles/global.css";
import type { MessageToMainV2, MessageToWorkerV2 } from "./typings/messages";

customElements.define("worker-terminal-element", WorkerTerminalElement);
customElements.define("github-config-element", GithubConfigElement);
customElements.define("db-config-element", DbConfigElement);
customElements.define("omnibox-element", OmniboxElement);
customElements.define("editor-element", EditorElement);

const worker = loadWorker();
const notifyWorker = getNotifier<MessageToWorkerV2>(worker);
const requestWorker = getRequester<MessageToWorkerV2, MessageToMainV2>(worker);

export default function main() {
  const omnibox = document.querySelector<OmniboxElement>("omnibox-element")!;

  omnibox.addEventListener("load-default", () => omnibox.setSuggestions([]));
  omnibox.addEventListener("search", async (e) => {
    const { respondDbSearch } = await requestWorker({
      requestDbSearch: { query: (e as CustomEvent<QueryEventDetail>).detail },
    });
    omnibox.setSuggestions(
      (respondDbSearch ?? []).map((item) => ({
        path: item.path,
        title: item.content.title,
      }))
    );
  });
  omnibox.addEventListener("open", (e) => {
    console.log((e as CustomEvent<OpenEventDetail>).detail);
  });
}

main();
