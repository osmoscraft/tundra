import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../../workers/data-worker";
import { getGithubConnection, setGithubConnection, type GithubConnection } from "./github-config";
import "./github-config-element.css";
import template from "./github-config-element.html";

export class GithubConfigElement extends HTMLElement {
  static dependencies: {
    proxy: AsyncProxy<DataWorkerRoutes>;
  };

  private form: HTMLFormElement;
  private menu: HTMLMenuElement;
  private proxy = GithubConfigElement.dependencies.proxy;

  constructor() {
    super();
    this.innerHTML = template;
    this.form = this.querySelector("form")!;
    this.menu = this.querySelector("menu")!;
  }

  connectedCallback() {
    this.load();

    if (location.search.includes("import")) {
      // remove import query param
      const mutableUrl = new URL(location.href);
      mutableUrl.searchParams.delete("import");
      history.replaceState({}, "", mutableUrl.toString());

      // start clone
      const { isValid, connection } = this.ensureValidConnection();
      if (isValid && connection) {
        this.proxy.clone(connection);
      }
    }

    this.form.addEventListener("submit", (e) => e.preventDefault());
    this.form.addEventListener("input", (e) => setGithubConnection(this.parseForm()));

    this.menu.addEventListener("click", async (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "test": {
          const { isValid, connection } = this.ensureValidConnection();
          if (!isValid) break;
          if (!connection) break;

          this.proxy.testGithubConnection(connection).then((res) => console.log("Is connected?", res));
          break;
        }

        case "import": {
          const { isValid } = this.ensureValidConnection();
          if (!isValid) break;

          await this.proxy.destoryDatabase();
          const mutableUrl = new URL(location.href);
          mutableUrl.searchParams.set("import", "true");
          location.replace(mutableUrl.toString());
          break;
        }

        case "export": {
          const { isValid, connection } = this.ensureValidConnection();
          if (!isValid) break;
          if (!connection) break;

          window.confirm("This will wipe out the entire history of the remote repo. Do you want to continue?") &&
            this.proxy.resetRemote(connection);
          break;
        }
      }
    });
  }

  private ensureValidConnection() {
    const connection = getGithubConnection();
    this.renderConnection(connection);

    const isValid = this.form.checkValidity();
    return {
      connection,
      isValid,
    };
  }

  private async load() {
    const cachedConnection = getGithubConnection();
    if (cachedConnection) {
      this.renderConnection(cachedConnection);
    }
  }

  private renderConnection(connection?: null | GithubConnection) {
    this.querySelector<HTMLInputElement>(`input[name="repo"]`)!.value = connection?.repo ?? "";
    this.querySelector<HTMLInputElement>(`input[name="owner"]`)!.value = connection?.owner ?? "";
    this.querySelector<HTMLInputElement>(`input[name="token"]`)!.value = connection?.token ?? "";
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
