import { getDb } from "../db/db";
import { createDelegationHandler } from "../utils/dom-events";
import { pull, push } from "../utils/sync";
import { loadTemplate } from "../utils/template";
import type { SettingsElement } from "./settings-dialog";
import "./sidebar.css";

const template = loadTemplate(/*html*/ `
<menu>
  <li><button data-command="create">New</button></li>
  <li><button data-command="sync">Sync</button></li>
  <li><button data-command="pull">Pull</button></li>
  <li><button data-command="push">Push</button></li>
</menu>
<ul id="recent-list"></ul>
<button data-command="settings">Settings</button>
`);

export class SidebarElement extends HTMLElement {
  connectedCallback() {
    const handleClick = createDelegationHandler("data-command", {
      create: () => {
        location.search = new URLSearchParams({
          frame: "new",
        }).toString();
      },
      sync: async () => {
        await pull();
        await push();
        renderRecentItems(this.querySelector<HTMLElement>("#recent-list")!);
      },
      open: (e) => {
        location.search = new URLSearchParams({
          frame: (e.target as HTMLElement).getAttribute("data-id")!,
        }).toString();
      },
      pull: async () => {
        await pull();
        renderRecentItems(this.querySelector<HTMLElement>("#recent-list")!);
      },
      push: async () => {
        await push();
        renderRecentItems(this.querySelector<HTMLElement>("#recent-list")!);
      },
      settings: () => document.querySelector<SettingsElement>("settings-element")!.open(),
    });

    this.addEventListener("click", handleClick);

    this.appendChild(template);

    renderRecentItems(this.querySelector<HTMLElement>("#recent-list")!);
  }
}

async function renderRecentItems(container: HTMLElement) {
  const dbInstance = await getDb();

  const frames = await dbInstance.getAll("frame");
  container.innerHTML = frames
    .map(
      (frame) => `<li class="nav-item">
    <button data-command="open" data-id="${frame.id}">[${frame.status}] ${frame.body.slice(0, 128)}</button>
  </li>`
    )
    .join("");
}
