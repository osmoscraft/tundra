const CACHE_KEY = "cache.key-bindings";
const KEY_BINDINGS_FILE_PATH = "config/key-bindings.json";
import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { CommandKeyBinding } from "../editor/commands";
import defaultKeyBindings from "./default-key-bindings.json";

export function clearKeyBindingsCache() {
  localStorage.removeItem(CACHE_KEY);
}

export function getKeyBindings(): CommandKeyBinding[] {
  const cachedRawFile = localStorage.getItem(CACHE_KEY);
  const customBindings = tryParseKeyBindings(cachedRawFile) ?? [];
  const mergedBindings = mergeKeyBindings(defaultKeyBindings.keyBindings, customBindings);
  return mergedBindings;
}

export function checkKeyBindingsUpdate(proxy: AsyncProxy<DataWorkerRoutes>, onUpdateNeeded?: () => void) {
  const cachedRawFile = localStorage.getItem(CACHE_KEY);

  return proxy.getFile(KEY_BINDINGS_FILE_PATH).then((file) => {
    const latest = file?.content ?? null;
    if (latest === cachedRawFile) return;

    const parsed = tryParseKeyBindings(latest);
    if (!file?.content || !parsed) {
      localStorage.removeItem(CACHE_KEY);
    } else {
      localStorage.setItem(CACHE_KEY, file.content);
    }
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

function mergeKeyBindings(defaultBindings: CommandKeyBinding[], customBindings: CommandKeyBinding[]) {
  const keyMap = new Map<string, CommandKeyBinding>();

  [...defaultBindings, ...customBindings].forEach((binding) => {
    keyMap.set(binding.name, binding);
  });

  return Array.from(keyMap.values());
}
