export function tapOnCommand(form: HTMLFormElement, handler: (command: string) => any) {
  handler(new FormData(form).get("command") as string);
  return form;
}

export function getForm(e: Event) {
  return e.target as HTMLFormElement;
}

export function getSuggestions() {}
