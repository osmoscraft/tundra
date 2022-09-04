import { ChangeStatus, openGraphDB } from "../graph/db";
import { generateInitialHeader, getLatestTimestampHeader, getSchemaHeaderFromEditorHeader } from "../utils/header";
import { pull, push } from "../utils/sync";
import "./app.css";
import type { FrameElement } from "./frame/frame";
import { schemaFrameToDisplayFrame, type NavbarElement } from "./navbar/navbar";
import type { PreferencesElement } from "./preferences/preferences";
import type { SearchElement } from "./search/search";
import type { SidebarElement } from "./sidebar/sidebar";

export class AppElement extends HTMLElement {
  private db = openGraphDB();

  private sidebarElement!: SidebarElement;
  private frameElement!: FrameElement;
  private navbarElement!: NavbarElement;
  private preferencesElement!: PreferencesElement;
  private searchElement!: SearchElement;

  async connectedCallback() {
    this.sidebarElement = this.querySelector("sidebar-element")!;
    this.frameElement = this.querySelector("frame-element")!;
    this.navbarElement = this.querySelector("navbar-element")!;
    this.preferencesElement = this.querySelector("preferences-element")!;
    this.searchElement = this.querySelector("search-element")!;

    const url = new URL(location.href);
    const frameId = url.searchParams.get("frame");
    if (!frameId) {
      location.search = new URLSearchParams({ frame: "new" }).toString();
      return;
    }

    const db = await this.db;
    const frames = await db.getAll("frame");
    this.navbarElement.load(frames.map(schemaFrameToDisplayFrame));

    const frame = await db.get("frame", frameId);
    this.sidebarElement.load(frame?.header ?? {});
    this.frameElement.load(frame?.body ?? "New frame");

    this.navbarElement.addEventListener("createFrame", () => (location.search = new URLSearchParams({ frame: "new" }).toString()));
    this.navbarElement.addEventListener("openFrame", (e) => (location.search = new URLSearchParams({ frame: e.detail }).toString()));
    this.navbarElement.addEventListener("syncAll", async () => {
      await pull();
      await push();
      const frames = await db.getAll("frame");
      this.navbarElement.load(frames.map(schemaFrameToDisplayFrame));
    });
    this.navbarElement.addEventListener("pullAll", async () => {
      await pull();
      const frames = await db.getAll("frame");
      this.navbarElement.load(frames.map(schemaFrameToDisplayFrame));
    });
    this.navbarElement.addEventListener("pushAll", async () => {
      await push();
      const frames = await db.getAll("frame");
      this.navbarElement.load(frames.map(schemaFrameToDisplayFrame));
    });
    this.navbarElement.addEventListener("openPreferences", () => this.preferencesElement.open());
    this.navbarElement.addEventListener("openSearch", () => this.searchElement.open());

    this.frameElement.addEventListener("saveFrame", async (e) => {
      if (!frame) {
        const id = await db.add("frame", {
          id: crypto.randomUUID(),
          header: getSchemaHeaderFromEditorHeader(generateInitialHeader()),
          body: e.detail,
          status: ChangeStatus.Create,
        });

        const searchParams = new URLSearchParams(location.search);
        searchParams.set("frame", id);
        location.search = searchParams.toString();
      } else {
        const existingFrame = await db.get("frame", frameId);
        if (!existingFrame) throw new Error("Error updating: frame no longer exists");

        await db.put("frame", {
          id: frameId,
          header: getSchemaHeaderFromEditorHeader(getLatestTimestampHeader(frame.header)),
          body: e.detail,
          status: existingFrame.status === ChangeStatus.Create ? ChangeStatus.Create : ChangeStatus.Update,
        });

        location.reload();
      }
    });

    console.log(`[main] loaded ${performance.mark("loaded").startTime.toFixed(2)}ms`);
  }
}
