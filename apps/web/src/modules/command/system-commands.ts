import type { Command } from "./command";

export const systemCommands: Command[] = [
  {
    syntax: "config open",
    description: "Open config dialog",
  },
  {
    syntax: "file sync",
    description: "Sync changes in all files",
  },
];
