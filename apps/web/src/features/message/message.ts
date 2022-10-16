import { curry } from "../../utils/functional/curry";

export interface Message {
  type: string;
  data?: any;
}

export const dispatchMessageOn = curry((target: EventTarget, message: Message) => {
  target.dispatchEvent(new CustomEvent("system.message", { detail: message }));
  return message;
});

export const messageThunk = (type: string, data?: any) => () => ({ type, data } as Message);
