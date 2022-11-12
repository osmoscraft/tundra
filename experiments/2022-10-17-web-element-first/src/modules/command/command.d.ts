export interface Command {
  key: string;
  description: string; // Short, descriptive label for human
  action: () => any;
  shortcuts?: Shortcut[];
  hidden?: boolean;
}

export interface Shortcut {
  keygram: string;
}
