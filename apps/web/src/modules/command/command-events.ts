import { defineCustomEvent } from "../event/define-event";

export const commandRunEvent = defineCustomEvent<string>("command.run", { bubbles: true });
