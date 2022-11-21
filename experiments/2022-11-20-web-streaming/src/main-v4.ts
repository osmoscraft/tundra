export default {};

let element = document.querySelector("#emit")!;
let onClick: any = () => {};
const clickStream = () =>
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
  new WritableStream<Event>({
    write: (chunk) => console.log(`wrote`, chunk),
    close: () => console.log("handle render stream closed"),
  });

const subscribeOnce = () => {
  const abort = new AbortController();
  clickStream()
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
