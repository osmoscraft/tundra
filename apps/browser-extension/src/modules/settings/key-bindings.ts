const CACHE_KEY = "cache.key-bindings";
const KEY_BINDINGS_FILE_PATH = "config/key-bindings.json";
import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { CommandKeyBinding } from "../editor/commands";
import defaultKeyBindings from "./default-key-bindings.json";

export function getKeyBindings(): CommandKeyBinding[] {
  const cachedRawFile = localStorage.getItem(CACHE_KEY);
  const initial = tryParseKeyBindings(cachedRawFile) ?? defaultKeyBindings.keyBindings;
  return initial;
}

export function checkKeyBindingsUpdate(proxy: AsyncProxy<DataWorkerRoutes>, onUpdateNeeded?: () => void) {
  const cachedRawFile = localStorage.getItem(CACHE_KEY);

  return proxy.getFile(KEY_BINDINGS_FILE_PATH).then((file) => {
    if (!file?.content) return;
    if (file.content === cachedRawFile) return;

    const parsed = tryParseKeyBindings(file?.content);
    if (!parsed) return;

    localStorage.setItem(CACHE_KEY, file.content);
    onUpdateNeeded?.();
  });
}

function tryParseKeyBindings(cachedRaw?: string | null): CommandKeyBinding[] | null {
  if (!cachedRaw) return null;

  try {
    const parsedBindings = JSON.parse(cachedRaw).keyBindings;
    return Array.isArray(parsedBindings) ? parsedBindings : null;
  } catch {
    return null;
  }
}
