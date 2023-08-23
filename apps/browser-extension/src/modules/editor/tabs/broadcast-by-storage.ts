export function until<T>(window: Window, storage: Storage, handler: (message: T) => boolean | Promise<boolean>) {
  const handleEvent = async (e: StorageEvent) => {
    if (e.newValue === null) return;

    const isHandled = await handler(tryParseValue(e.newValue));
    if (isHandled) {
      storage.removeItem("broadcast.temp");
      window.removeEventListener("storage", handleEvent);
    }
  };

  window.addEventListener("storage", handleEvent);
}

export function broadcast<T>(storage: Storage, message: T) {
  storage.setItem("broadcast.temp", JSON.stringify(message));
}

function tryParseValue(value: unknown) {
  try {
    return JSON.parse(value as string);
  } catch (e) {
    return null;
  }
}

export function init(storage: Storage) {
  storage.removeItem("broadcast.temp");
}
