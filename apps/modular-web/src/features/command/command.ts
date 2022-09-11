export function reset(form: HTMLFormElement) {
  form.reset();
  return form;
}

export function tapOnCommand(form: HTMLFormElement, handler: (command: string) => any) {
  handler(new FormData(form).get("command") as string);
  return form;
}

export function preventDefault(e: Event) {
  e.preventDefault();
  return e;
}

export function getForm(e: Event) {
  return e.target as HTMLFormElement;
}
