import { getGitHubContext, setGitHubContext } from "../../git/github-context";
import { forceClone, testConnection } from "../../sync/sync";
import { createDelegationHandler } from "../../utils/dom-events";
import { loadTemplate } from "../../utils/template";
import "./preferences.css";

const template = loadTemplate(/*html*/ `
<dialog>
  <h1>Settings</h1>
  <button data-command="close">Close</button>

  <form>
    <div>
      <label for="owner">Owner</label>
      <input name="owner" required id="owner" type="text">
    </div>
    <div>
      <label for="repo">Repo</label>
      <input name="repo" required id="repo" type="text">
    </div>
    <div>
      <label for="token">Access token</label>
      <input name="token" required id="token" type="password">
    </div>

    <button data-command="test">Test</button>
    <button type="submit">Save</button>

    <br>
    <br>
    <hr>
    <br>
    <br>
    <button data-command="forceClone">Force clone</button>
  </form>
</dialog>
`);

export class PreferencesElement extends HTMLElement {
  connectedCallback() {
    const handleClick = createDelegationHandler("data-command", {
      close: () => this.querySelector<any>("dialog")?.close(),
      test: testConnection,
      forceClone,
    });

    this.addEventListener("click", handleClick);

    populateForm(template.querySelector("form")!);
    template.querySelector("form")!.addEventListener("submit", handleFormSubmit);
    this.appendChild(template);
  }

  open() {
    this.querySelector<any>("dialog")!.showModal();
  }
}

async function populateForm(form: HTMLFormElement) {
  const account = await getGitHubContext();
  if (!account) return;

  Object.entries(account).forEach((entry) => {
    form.querySelector<HTMLInputElement>(`[name="${entry[0]}"]`)!.value = entry[1] as string;
  });
}

async function handleFormSubmit(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  if (!form.reportValidity()) return;

  const data: any = {};
  new FormData(form).forEach((v, k) => (data[k] = v as string));

  await setGitHubContext(data);
}
