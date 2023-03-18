import { attachShadowHtml } from "../../utils/dom";
import type { GraphStats } from "./get-graph-stats";
import template from "./graph-stats-element.html";

export class GraphStatsElement extends HTMLElement {
  shadowRoot = attachShadowHtml(template, this);
  private inList = this.shadowRoot.querySelector<HTMLUListElement>("#in-list")!;
  private outCapturedList = this.shadowRoot.querySelector<HTMLUListElement>("#out-captured-list")!;
  private outSharedList = this.shadowRoot.querySelector<HTMLUListElement>("#out-shared-list")!;

  loadData(stats: GraphStats) {
    this.inList.innerHTML = stats.inNodes.map((node) => `<li><a href="${node.url}">${node.title}</a></li>`).join("");
    this.outCapturedList.innerHTML = stats.outCapturedNodes
      .map((node) => `<li><a href="${node.url}">${node.title}</a></li>`)
      .join("");
    this.outSharedList.innerHTML = stats.outSharedNodes
      .map((node) => `<li><a href="${node.url}">${node.title}</a></li>`)
      .join("");
  }
}
