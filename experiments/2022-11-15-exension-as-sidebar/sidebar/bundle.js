console.log("bundle live");
const template = /*html*/ `
<style>
* {
  margin: 0;
  padding: 0;
  font-size: inherit;
  box-sizing: border-box;
}

.root {
  font-size: 16px;
  padding: 8px;
  overflow-x: auto;
  height: 100%;

}
</style>
<div class="root">
  <h1>Title</h1>
  <ul></ul>
</div>
`;

class LensBarElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = template;
    this.listRoot = this.shadowRoot.querySelector("ul");
  }

  connectedCallback() {
    this.listRoot.append(
      ...[...document.querySelectorAll("a")].map((anchor) => {
        const a = document.createElement("a");
        a.href = anchor.href;
        a.innerText = anchor.innerText.slice(0, 100);
        return a;
      })
    );

    this.hidden = false;
  }

  destory() {
    this.remove();
  }
}

customElements.define("lens-sidebar-element", LensBarElement);
