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

        case "pull": {
          throw new Error("Not implemented");
          break;
        }
      }
    });
  }

  private async load() {
    const respondGithubConnection = await this.proxy.getGithubConnection();
    if (!respondGithubConnection) return;

    this.querySelector<HTMLInputElement>(`input[name="repo"]`)!.value = respondGithubConnection.repo;
    this.querySelector<HTMLInputElement>(`input[name="owner"]`)!.value = respondGithubConnection.owner;
    this.querySelector<HTMLInputElement>(`input[name="token"]`)!.value = respondGithubConnection.token;
  }

  private save() {
    this.proxy.setGithubConnection(this.parseForm());
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
