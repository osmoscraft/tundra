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
