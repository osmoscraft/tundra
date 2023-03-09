import { attachShadowHtml } from "../../../utils/dom";
import { getConnection, GithubConnection, saveConnection } from "./config-storage";
import template from "./github-config-element.html";
import { download, testConnection } from "./operations";

export class GithubConfigElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private form = this.shadowRoot.querySelector("form")!;
  private menu = this.shadowRoot.querySelector("menu")!;
  private status = this.shadowRoot.querySelector("#status")!;

  connectedCallback() {
    this.load();

    this.form.addEventListener("submit", (e) => e.preventDefault());

    this.form.addEventListener("input", (e) => {
      e.preventDefault();
      if (!this.form.checkValidity()) return;
      this.save();
    });

    this.menu.addEventListener("click", async (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "test": {
          this.reportStatus("Testing...");

          const isValid = this.form.checkValidity();
          if (!isValid) break;

          const connection = getConnection();
          if (!connection) break;

          const success = await testConnection(connection);
          this.reportStatus(success ? "Success" : "Failed");
          break;
        }

        case "import": {
          this.reportStatus("Testing...");

          const isValid = this.form.checkValidity();
          if (!isValid) break;

          const connection = getConnection();
          if (!connection) break;

          const testSuccess = await testConnection(connection);
          this.reportStatus(testSuccess ? "Success" : "Failed");
          if (!testSuccess) break;

          this.reportStatus("Importing...");
          let itemCount = 0;
          // TODO open BD
          const onItem = () => {
            itemCount++;
            this.reportStatus(itemCount.toString());
          };
          await download(connection, onItem);

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

  private reportStatus(text: string) {
    console.log(this.status.textContent!.split("\n"));
    this.status.textContent = [...this.status.textContent!.split("\n").filter(Boolean), text].slice(-100).join("\n");

    this.status.scrollTop = this.status.scrollHeight;
  }
}
