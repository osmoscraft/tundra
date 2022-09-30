import { useEffect, useRef } from "preact/hooks";
import { getGitHubContext, setGitHubContext } from "../../services/git/github-context";

export interface PreferencesProps {}
export function Preferences(props: PreferencesProps) {
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

      <button type="submit">Save</button>
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
