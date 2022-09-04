import type { AppStoreSchema, ChangeStatus } from "../../db/db";
import { loadTemplate } from "../../utils/template";
import "./navbar.css";

const template = loadTemplate(/*html*/ `
<menu>
  <li><button data-command="createFrame">New</button></li>
  <li><button data-command="syncAll">Sync</button></li>
  <li><button data-command="pullAll">Pull</button></li>
  <li><button data-command="pushAll">Push</button></li>
</menu>
<ul id="recent-list"></ul>
<menu>
  <li><button data-command="openSearch">Search</button></li>
  <li><button data-command="openPreferences">Preferences</button></li>
</menu>
`);

declare global {
  interface ElementEventMap {
    createFrame: Event;
    syncAll: Event;
    pullAll: Event;
    pushAll: Event;
    openPreferences: Event;
    openSearch: Event;
    openFrame: CustomEvent<string>;
  }
}

export interface DisplayFrame {
  id: string;
  status: ChangeStatus;
  title: string;
}
export class NavbarElement extends HTMLElement {
  connectedCallback() {
    this.appendChild(template);

    this.addEventListener("click", (e) => {
      const commandName = (e.target as HTMLElement).getAttribute("data-command")!;
      let detail: any = undefined;
      if (commandName === "openFrame") {
        const id = (e.target as HTMLElement).getAttribute("data-id")!;
        detail = id;
      }
      this.dispatchEvent(new CustomEvent(commandName, { detail }));
    });
  }

  load(recentFrames: DisplayFrame[]) {
    renderRecentItems(this.querySelector<HTMLElement>("#recent-list")!, recentFrames);
  }
}

async function renderRecentItems(container: HTMLElement, recentFrames: DisplayFrame[]) {
  container.innerHTML = recentFrames
    .map(
      (frame) => `<li class="nav-item">
    <button data-command="openFrame" data-id="${frame.id}">[${frame.status}] ${frame.title}</button>
  </li>`
    )
    .join("");
}

export function schemaFrameToDisplayFrame(frame: AppStoreSchema["frame"]["value"]): DisplayFrame {
  return {
    ...frame,
    title: frame.body.slice(0, 128),
  };
}
