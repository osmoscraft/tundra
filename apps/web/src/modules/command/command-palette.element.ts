export class CommandPaletteElement extends HTMLElement {
  connectedCallback() {
    const form$ = this.querySelector("form")!;
    form$.addEventListener("submit", (e) => {
      e.preventDefault();
      const commandString = new FormData(form$).get("command");
      console.log(commandString);
      form$.reset();
    });
  }
}
