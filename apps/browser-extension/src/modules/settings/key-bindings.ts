const CACHE_KEY = "tinykb.cache.key-bindings";
import type { AsyncProxy } from "@tinykb/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";
import type { CommandKeyBinding } from "../editor/commands";
import defaultKeyBindings from "./default-key-bindings.json";

export function loadKeyBindings(proxy: AsyncProxy<DataWorkerRoutes>, onChange: () => void): CommandKeyBinding[] {
  // immediately return cached settings if exists, otherwise, return default settings
  const cached = localStorage.getItem(CACHE_KEY);
  const initial = tryParseKeyBindings(cached) ?? defaultKeyBindings.keyBindings;

  // load settings from proxy, if no change, noop
  // if changed, update cache and emit settings change event

  return initial;
}

function tryParseKeyBindings(cachedRaw: string | null): CommandKeyBinding[] | null {
  if (!cachedRaw) return null;

  try {
    const parsedBindings = JSON.parse(cachedRaw).keyBindings;
    return Array.isArray(parsedBindings) ? parsedBindings : null;
  } catch {
    return null;
  }
}
