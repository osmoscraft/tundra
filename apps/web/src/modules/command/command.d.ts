export interface Command {
  syntax: string; // UNIX like documentation indicating how the command should be parsed
  description: string; // Short, descriptive label for human
  action: () => any;
  shortcuts?: Shortcut[];
  hidden?: boolean;
}

export interface Shortcut {
  keygram: string;
}
