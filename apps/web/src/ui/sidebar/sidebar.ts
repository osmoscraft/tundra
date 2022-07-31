import { loadTemplate } from "../../utils/template";
import "./sidebar.css";

const template = loadTemplate(/*html*/ `
<aside>
  <pre><code id="metadata-display"></code></pre>
</aside>
`);

export interface SidebarMetadata {
  ctime?: Date;
  btime?: Date;
}

export class SidebarElement extends HTMLElement {
  connectedCallback() {
    this.appendChild(template);
  }

  load(data: SidebarMetadata) {
    this.querySelector<HTMLElement>(`#metadata-display`)!.innerHTML = JSON.stringify(data, null, 2);
  }
}
