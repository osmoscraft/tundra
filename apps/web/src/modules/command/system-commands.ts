import type { Command } from "./command";

export const systemCommands: Command[] = [
  {
    syntax: "commands",
    description: "Open command palette",
  },
  {
    syntax: "config open",
    description: "Open config dialog",
  },
  {
    syntax: "file sync all",
    description: "Sync changes in all files",
  },
  {
    syntax: "file save",
    description: "Save changes in the current files",
  },
];
