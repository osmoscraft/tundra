import { createDelegationHandler } from "../../utils/dom-events";
import { loadTemplate } from "../../utils/template";
import "./search.css";

const template = loadTemplate(/*html*/ `
<dialog>
  <h1>Search</h1>
  <button data-command="close">Close</button>

  <form>
    <div>
      <label for="query">query</label>
      <input name="query" required id="query" type="text">
    </div>
    <button type="submit">Search</button>
  </form>
</dialog>
`);

export class SearchElement extends HTMLElement {
  connectedCallback() {
    const handleClick = createDelegationHandler("data-command", {
      close: () => this.querySelector<any>("dialog")?.close(),
    });

    this.addEventListener("click", handleClick);

    template.querySelector("form")!.addEventListener("submit", handleFormSubmit);
    this.appendChild(template);
  }

  open() {
    this.querySelector<any>("dialog")!.showModal();
  }
}

async function handleFormSubmit(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const data: any = {};
  new FormData(form).forEach((v, k) => (data[k] = v as string));
  console.log(data);
}
