export function tapOnCommand(form: HTMLFormElement, handler: (command: string) => any) {
  handler(new FormData(form).get("command") as string);
  return form;
}

export function getForm(e: Event) {
  return e.target as HTMLFormElement;
}

export type SuggestHandler = (command: string) => Promise<string[]>;
export function createSuggester(handlers: SuggestHandler[]) {
  return async (command: string) => (await Promise.all(handlers.map((handler) => handler(command)))).flat();
}
