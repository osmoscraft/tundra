import { useEffect, useRef } from "preact/hooks";
import { openAppDB } from "../../services/db/db";
import { resetTx } from "../../services/db/tx";
import { getGitHubContext, setGitHubContext } from "../../services/git/github-context";
import { getRemoteAll } from "../../services/sync/sync";
import { ensure } from "../../utils/flow-control";

export function Preferences() {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => void (formRef.current && populateForm(formRef.current)), []);

  return (
    <form ref={formRef} onSubmit={handleFormSubmit}>
      <h1>Settings</h1>
      <div>
        <label for="owner">Owner</label>
        <input name="owner" required id="owner" type="text" />
      </div>
      <div>
        <label for="repo">Repo</label>
        <input name="repo" required id="repo" type="text" />
      </div>
      <div>
        <label for="token">Access token</label>
        <input name="token" required id="token" type="password" />
      </div>

      <button data-command="test">Test</button>
      <button type="submit">Save</button>

      <br />
      <br />
      <hr />
      <br />
      <br />
      <button onClick={handleClone}>Force clone</button>
    </form>
  );
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

async function handleClone() {
  const context = ensure(await getGitHubContext());
  const remoteAll = await getRemoteAll(context);
  const db = await openAppDB();
  resetTx(db, remoteAll.frames, remoteAll.sha);
}
