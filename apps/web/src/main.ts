import { HaikuEditorElement } from "@tinykb/haiku-editor";
import "@tinykb/haiku-editor/haiku-editor.css";
import { AppElement } from "./ui/app";
import { FrameElement } from "./ui/frame/frame";
import { NavbarElement } from "./ui/navbar/navbar";
import { PreferencesElement } from "./ui/preferences/preferences";
import { SidebarElement } from "./ui/sidebar/sidebar";

customElements.define("haiku-editor-element", HaikuEditorElement);

customElements.define("app-element", AppElement);
customElements.define("frame-element", FrameElement);
customElements.define("navbar-element", NavbarElement);
customElements.define("sidebar-element", SidebarElement);
customElements.define("preferences-element", PreferencesElement);
