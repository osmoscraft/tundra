import type { LogWatch, RemoteUpdate, RemoteWatch, RepoClone, RepoTest } from "../../routes";
import { attachHtml } from "../../utils/dom/factory";
import { request, subscribe } from "../../utils/rpc/client-utils";
import { RemoteType } from "../db";
import { port } from "../global/port";
import template from "./config-form.html";

export class ConfigElement extends HTMLElement {
  shadowRoot = attachHtml(template, this);
  cleanupFns: Function[] = [];
  formElement = this.shadowRoot.querySelector("form")!;
  testElement = this.shadowRoot.querySelector<HTMLButtonElement>(`[data-action="test"]`)!;
  cloneElement = this.shadowRoot.querySelector<HTMLButtonElement>(`[data-action="clone"]`)!;
  statusElement = this.shadowRoot.querySelector<HTMLDivElement>("#output");

  connectedCallback() {
    this.cleanupFns.push(
      subscribe<RemoteWatch>(port, "remote/watch", ({ value }) => {
        const form = this.shadowRoot.querySelector("form")!;
        Object.entries(value?.connection ?? {}).map(
          ([k, v]) => (form.querySelector<HTMLInputElement>(`[name="${k}"]`)!.value = v as string)
        );
      })
    );

    this.shadowRoot.addEventListener("submit", async (e) => {
      e.preventDefault();
      const stopLogging = startLogging(this.statusElement!);
      try {
        const formData = new FormData(this.shadowRoot.querySelector("form")!);
        await request<RemoteUpdate>(port, "remote/update", {
          type: RemoteType.GitHubToken,
          connection: {
            owner: formData.get("owner") as string,
            repo: formData.get("repo") as string,
            token: formData.get("token") as string,
          },
        });
      } finally {
        stopLogging();
      }
    });

    this.testElement.addEventListener("click", async () => {
      const formData = new FormData(this.shadowRoot.querySelector("form")!);
      const stopLogging = startLogging(this.statusElement!);
      try {
        await request<RepoTest>(port, "repo/test", {
          type: RemoteType.GitHubToken,
          connection: {
            owner: formData.get("owner") as string,
            repo: formData.get("repo") as string,
            token: formData.get("token") as string,
          },
        });
      } finally {
        stopLogging();
      }
    });

    this.cloneElement.addEventListener("click", async () => {
      const formData = new FormData(this.shadowRoot.querySelector("form")!);
      const stopLogging = startLogging(this.statusElement!);
      try {
        await request<RemoteUpdate>(port, "remote/update", {
          type: RemoteType.GitHubToken,
          connection: {
            owner: formData.get("owner") as string,
            repo: formData.get("repo") as string,
            token: formData.get("token") as string,
          },
        });

        await request<RepoClone>(port, "repo/clone");
      } finally {
        stopLogging();
      }
    });
  }

  disconnectedCallback() {
    this.cleanupFns.forEach((f) => f());
  }
}

function startLogging(statusElement: HTMLElement) {
  const stop = subscribe<LogWatch>(port, "log/watch", (data) => {
    const logEntry = document.createElement("div");
    logEntry.innerHTML = data.value!.message;
    statusElement.appendChild(logEntry);
  });

  return stop;
}
