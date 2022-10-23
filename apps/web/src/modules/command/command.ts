import { emit } from "../../utils/dom/event";

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
