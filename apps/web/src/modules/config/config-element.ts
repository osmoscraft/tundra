import { commandRunEvent } from "../command/command-events";
import { dbAsync } from "../db/instance";
import { getRemote, setRemote } from "../db/queries";
import { RemoteSchema, RemoteType } from "../db/schema";
import { termWriteEvent } from "../terminal/terminal-element";

export class ConfigElement extends HTMLElement {
  connectedCallback() {
    const form$ = this.querySelector("form")!;

    dbAsync.then(async (db) => {
      const remote = await getRemote(db);
      const existingConfig = remote.connection;
      Object.entries(existingConfig).forEach(([name, value]) => (this.querySelector<HTMLInputElement>(`[name="${name}"]`)!.value = value));
    });

    form$.addEventListener("submit", async (e) => {
      e.preventDefault();
      const config = Object.fromEntries(new FormData(form$).entries());
      const remote: RemoteSchema = { type: RemoteType.GitHubToken, connection: config as any };

      const db = await dbAsync;
      await setRemote(db, remote);
      termWriteEvent.emit(this, "Remote saved");
    });

    this.querySelector("#test-remote")?.addEventListener("click", () => commandRunEvent.emit(this, "fs.remote.test"));
  }
}
