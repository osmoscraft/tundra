import { ConfigElement } from "./features/config/config-form";

export async function main() {
  customElements.define("config-element", ConfigElement);
}

main();
