import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { GithubConnection } from "..";
import type { DataWorkerRoutes } from "../../../workers/data-worker";
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

    this.form.addEventListener("submit", (e) => e.preventDefault());
    this.form.addEventListener("input", (e) => this.save());

    this.menu.addEventListener("click", async (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      switch (action) {
        case "test": {
          const isValid = this.form.checkValidity();
          if (!isValid) break;

          this.proxy.testGithubConnection().then((res) => console.log("Is connected?", res));
          break;
        }

        case "import": {
          this.proxy.clone();
          break;
        }

        case "export": {
          window.confirm("This will wipe out the entire history of the remote repo. Do you want to continue?") &&
            this.proxy.resetRemote();
          break;
        }
      }
    });
  }

  private async load() {
    // use cache first, then use source of truth
    const cachedConnection = this.getConnectionCache();
    if (cachedConnection) {
      this.renderConnection(cachedConnection);
    } else {
      const respondGithubConnection = await this.proxy.getGithubConnection();
      if (!respondGithubConnection) return;

      this.renderConnection(respondGithubConnection);
      this.setConnectionCache(respondGithubConnection);
    }
  }

  private renderConnection(connection: GithubConnection) {
    this.querySelector<HTMLInputElement>(`input[name="repo"]`)!.value = connection.repo;
    this.querySelector<HTMLInputElement>(`input[name="owner"]`)!.value = connection.owner;
    this.querySelector<HTMLInputElement>(`input[name="token"]`)!.value = connection.token;
  }

  private save() {
    const connection = this.parseForm();

    // update source of truth first, then update cache
    this.proxy.setGithubConnection(connection).then(() => this.setConnectionCache(connection));
  }

  private setConnectionCache(connection: GithubConnection) {
    localStorage.setItem("tinykb.cache.github-connection", JSON.stringify(connection));
  }

  private getConnectionCache(): GithubConnection | null {
    const raw = localStorage.getItem("tinykb.cache.github-connection");
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
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
