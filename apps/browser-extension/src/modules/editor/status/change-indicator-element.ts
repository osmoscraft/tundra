import "./change-indicator-element.css";
import template from "./change-indicator-element.html";

export enum ChangeIndicatorStatus {
  Unknown = "unknown",
  Clean = "clean",
  Add = "add",
  Modify = "modify",
}

export class ChangeIndicatorElement extends HTMLElement {
  private changeIndicator: HTMLElement;
  private isChanged: null | boolean = null;
  private isExisting: null | boolean = null;

  constructor() {
    super();
    this.innerHTML = template;
    this.changeIndicator = this.querySelector<HTMLElement>(".js-change-indicator")!;
  }

  connectedCallback() {}

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
      case this.isChanged === null || this.isExisting === null:
        return ChangeIndicatorStatus.Unknown;
      case this.isExisting === false:
        return ChangeIndicatorStatus.Add;
      case this.isChanged === true:
        return ChangeIndicatorStatus.Modify;
      case this.isChanged === false:
        return ChangeIndicatorStatus.Clean;
      default:
        return ChangeIndicatorStatus.Unknown;
    }
  }
}
