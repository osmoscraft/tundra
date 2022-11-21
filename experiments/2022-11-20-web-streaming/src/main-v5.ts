export default {};

let onClick: any = () => {};
const clickStream = (element: Element) =>
  new ReadableStream<Event>({
    start(controller) {
      console.log("click handler registered");
      onClick = (e: Event) => {
        console.log("click handled");
        controller.enqueue(e);
      };

      element.addEventListener("click", onClick);
    },
    cancel(reasone: any) {
      console.log("Cancel requested");
      element.removeEventListener("click", onClick);
    },
  });

const renderStream = () =>
  new WritableStream<any>({
    write: (chunk) => console.log(`render`, chunk),
    close: () => console.log("handle render stream closed"),
  });

const counterStream = () => {
  let count = 0;
  return new TransformStream<Event, number>({
    transform: (_chunk, controller) => controller.enqueue(++count),
  });
};

const subscribeOnce = () => {
  const abort = new AbortController();
  clickStream(document.querySelector("#emit")!)
    .pipeThrough(counterStream())
    .pipeTo(renderStream(), { signal: abort.signal })
    .catch((rej) => console.log("rejection", rej));

  return () => {
    console.log("Will cancel stream");
    abort.abort("User cancel");
  };
};

let stop = () => {};
document.querySelector("#start")!.addEventListener("click", () => {
  stop = subscribeOnce();
});

document.querySelector("#stop")!.addEventListener("click", () => {
  stop();
});
