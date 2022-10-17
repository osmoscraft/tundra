declare global {
  interface WindowEventMap extends CustomEventMap {}

  interface CustomEventMap {
    "shell.openDialog": CustomEvent<{ fragment: DocumentFragment }>;
    "shell.closeDialog": CustomEventMap<void>;
    "shell.openCommander": CustomEvent<void>;
    "shell.execCommand": CustomEvent<keyof CustomEventMap>;
  }
}

export default {};
