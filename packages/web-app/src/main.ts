import "./main.css";
import { FrameElement } from "./ui/frame";
import { SettingsElement } from "./ui/settings-dialog";
import { SidebarElement } from "./ui/sidebar";

customElements.define("frame-element", FrameElement);
customElements.define("sidebar-element", SidebarElement);
customElements.define("settings-element", SettingsElement);
