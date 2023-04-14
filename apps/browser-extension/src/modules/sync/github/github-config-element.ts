import { getDbWorker } from "../../db/get-db-worker";
import { attachShadowHtml } from "../../dom/shadow";
import { getConnection, saveConnection, type GithubConnection } from "./config-storage";
import template from "./github-config-element.html";

export class GithubConfigElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private menu = this.shadowRoot.querySelector("menu")!;
  private status = this.shadowRoot.querySelector("#status")!;
  private worker = getDbWorker();

  connectedCallback() {
    this.load();

    this.form.addEventListener("submit", (e) => e.preventDefault());
    this.form.addEventListener("input", (e) => this.save());

    this.menu.addEventListener("click", async (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "test": {
          const isValid = this.form.checkValidity();
          if (!isValid) break;

          const connection = getConnection();
          if (!connection) break;

          break;
        }

        case "import": {
          const isValid = this.form.checkValidity();
          if (!isValid) break;

          const connection = getConnection();
          if (!connection) break;

          break;
        }

        case "pull": {
          const isValid = this.form.checkValidity();
          if (!isValid) break;

          const connection = getConnection();
          if (!connection) break;

          break;
        }
      }
    });
  }

  private load() {
    const existingConnection = getConnection();
    if (!existingConnection) return;

    this.shadowRoot.querySelector<HTMLInputElement>(`input[name="repo"]`)!.value = existingConnection.repo;
    this.shadowRoot.querySelector<HTMLInputElement>(`input[name="owner"]`)!.value = existingConnection.owner;
    this.shadowRoot.querySelector<HTMLInputElement>(`input[name="token"]`)!.value = existingConnection.token;
  }

  private save() {
    saveConnection(this.parseForm());
  }

  private parseForm() {
    const formData = new FormData(this.form);
    const connection: GithubConnection = {
      repo: formData.get("repo") as string,
      owner: formData.get("owner") as string,
      token: formData.get("token") as string,
    };

    return connection;
  }
}
