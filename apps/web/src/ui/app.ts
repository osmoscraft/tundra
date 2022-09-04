import { GraphModule } from "../graph/graph";
import { pull, push } from "../utils/sync";
import "./app.css";
import type { FrameElement } from "./frame/frame";
import { schemaFrameToDisplayFrame, type NavbarElement } from "./navbar/navbar";
import type { PreferencesElement } from "./preferences/preferences";
import type { SearchElement } from "./search/search";
import type { SidebarElement } from "./sidebar/sidebar";

export class AppElement extends HTMLElement {
  private graph = new GraphModule();

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

    const frames = await this.graph.getAllFrames();
    this.navbarElement.load(frames.map(schemaFrameToDisplayFrame));

    const frame = (await this.graph.getFrames([frameId]))[0];
    this.sidebarElement.load(frame?.header ?? {});
    this.frameElement.load(frame?.body ?? "New frame");

    this.navbarElement.addEventListener("createFrame", () => (location.search = new URLSearchParams({ frame: "new" }).toString()));
    this.navbarElement.addEventListener("openFrame", (e) => (location.search = new URLSearchParams({ frame: e.detail }).toString()));
    this.navbarElement.addEventListener("syncAll", async () => {
      await pull();
      await push();
      const frames = await this.graph.getAllFrames();
      this.navbarElement.load(frames.map(schemaFrameToDisplayFrame));
    });
    this.navbarElement.addEventListener("pullAll", async () => {
      await pull();
      const frames = await this.graph.getAllFrames();
      this.navbarElement.load(frames.map(schemaFrameToDisplayFrame));
    });
    this.navbarElement.addEventListener("pushAll", async () => {
      await push();
      const frames = await this.graph.getAllFrames();
      this.navbarElement.load(frames.map(schemaFrameToDisplayFrame));
    });
    this.navbarElement.addEventListener("openPreferences", () => this.preferencesElement.open());
    this.navbarElement.addEventListener("openSearch", () => this.searchElement.open());

    this.frameElement.addEventListener("saveFrame", async (e) => {
      if (!frame) {
        const [result] = await this.graph.createFrames([{ body: e.detail }]);
        const searchParams = new URLSearchParams(location.search);
        searchParams.set("frame", result.id);
        location.search = searchParams.toString();
      } else {
        await this.graph.updateFrames([{ id: frameId, body: e.detail }]);
        location.reload();
      }
    });

    console.log(`[main] loaded ${performance.mark("loaded").startTime.toFixed(2)}ms`);
  }
}
