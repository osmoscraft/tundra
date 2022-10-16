import { formData } from "../../utils/dom/form";
import { uiModalExitEvent } from "../modal/focus-trap-element";

export class ConfigElement extends HTMLElement {
  connectedCallback() {
    const form$ = this.querySelector("form")!;

    const existingConfig = JSON.parse(localStorage.getItem("config") ?? "{}") as Record<string, string>;
    Object.entries(existingConfig).forEach(([name, value]) => (this.querySelector<HTMLInputElement>(`[name="${name}"]`)!.value = value));

    form$.addEventListener("submit", (e) => {
      e.preventDefault();
      const config = Object.fromEntries(formData(form$).entries());
      localStorage.setItem("config", JSON.stringify(config));
      this.dispatchEvent(uiModalExitEvent());
    });
  }
}
