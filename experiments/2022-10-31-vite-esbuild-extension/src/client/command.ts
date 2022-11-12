import { emit } from "utils";

export type Command = [name: string, handler: (cmd: string) => any];
export const runCommand = (commands: Command[], e: CustomEvent<string>) => {
  const foundCommand = commands.find((cmd) => cmd[0] === e.detail);
  if (foundCommand) {
    foundCommand?.[1](e.detail);
  } else {
    emit("log.append", { detail: { level: "error", message: `"${e.detail}" not found` } });
  }

  return e;
};

export const handleCommandMatch = (commands: Command[], e: CustomEvent<string>) => {
  emit("command.respond-match", { detail: matchCommands(commands, e.detail) }, e.target!);
};

const matchCommands = (commands: Command[], query: string) => {
  const exactMatched = commands.filter((cmd) => cmd[0] === query).map((cmd) => cmd[0]);
  const prefixMatched = commands.filter((cmd) => cmd[0].startsWith(query)).map((cmd) => cmd[0]);
  const partialMatched = commands.filter((cmd) => cmd[0].includes(query)).map((cmd) => cmd[0]);
  return [...new Set([...exactMatched, ...prefixMatched, ...partialMatched])];
};
