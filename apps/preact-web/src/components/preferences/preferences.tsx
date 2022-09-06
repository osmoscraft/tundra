export function Preferences() {
  return (
    <form>
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
      <button data-command="forceClone">Force clone</button>
    </form>
  );
}
