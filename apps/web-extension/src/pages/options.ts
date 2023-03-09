import { GithubConfigElement } from "../modules/sync/github/github-config-element";
import "./options.css";

customElements.define("github-config-element", GithubConfigElement);

export default function main() {
  console.log("hello options");
}

main();
