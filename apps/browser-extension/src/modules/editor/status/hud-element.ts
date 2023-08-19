import "./hud-element.css";
import template from "./hud-element.html";

export enum HudStatus {
  Unknown = "unknown",
  Clean = "clean",
  Add = "add",
  Modify = "modify",
}

export class HudElement extends HTMLElement {
  private changeIndicator: HTMLElement;
  private isChanged: null | boolean = null;
  private isExisting: null | boolean = null;
  private isFocused: boolean = false;

  constructor() {
    super();
    this.innerHTML = template;
    this.changeIndicator = this.querySelector<HTMLElement>(".js-hud-bar")!;
  }

  connectedCallback() {}

  setIsFocused(isFocused: boolean) {
    this.isFocused = isFocused;
    this.changeIndicator.dataset.status = this.resolveStatus();
  }

  setIsChanged(isChanged: boolean) {
    this.isChanged = isChanged;
    this.changeIndicator.dataset.status = this.resolveStatus();
  }

  setIsExisting(isExisting: boolean) {
    this.isExisting = isExisting;
    this.changeIndicator.dataset.status = this.resolveStatus();
  }

  resolveStatus() {
    switch (true) {
      case this.isFocused === false:
        return HudStatus.Unknown;
      case this.isChanged === null || this.isExisting === null:
        return HudStatus.Unknown;
      case this.isExisting === false:
        return HudStatus.Add;
      case this.isChanged === true:
        return HudStatus.Modify;
      case this.isChanged === false:
        return HudStatus.Clean;
      default:
        return HudStatus.Unknown;
    }
  }
}
