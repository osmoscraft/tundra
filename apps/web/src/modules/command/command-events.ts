import { customEvent } from "../event/event-factories";

export const commandRunEvent = (command: string) => customEvent("command.run", { detail: command, bubbles: true });
