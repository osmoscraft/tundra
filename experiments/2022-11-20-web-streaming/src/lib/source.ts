export const clickSource = (element: Element) => {
  let activeHandler: EventListener = () => {};
  return new ReadableStream<Event>({
    start(controller) {
      activeHandler = (e: Event) => controller.enqueue(e);
      element.addEventListener("click", activeHandler);
    },
    cancel(_reasone: any) {
      element.removeEventListener("click", activeHandler);
    },
  });
};

export const createSource = <T = any>(sourceFn: (next: (value: T) => void) => () => void) => {
  let unsubscribe: any = () => {};

  const stream = new ReadableStream<T>(
    {
      pull: (controller) =>
        new Promise(() => {
          const next = (value: T) => controller.enqueue(value);
          unsubscribe = sourceFn(next);
        }),
      cancel: () => unsubscribe(),
    },
    { highWaterMark: 0 }
  );

  return stream;
};

export const clickSourceV2 = (element: Element) =>
  createSource<Event>((next) => {
    const handler = (e: Event) => next(e);

    element.addEventListener("click", handler);

    return () => element.removeEventListener("click", handler);
  });
