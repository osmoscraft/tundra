export default {};

const clickStream = (element: Element) => {
  let cancelCallback: any = () => {};
  return new ReadableStream<Event>({
    start(controller) {
      console.log("click handler registered");
      cancelCallback = (e: Event) => {
        console.log("click handled");
        controller.enqueue(e);
      };

      element.addEventListener("click", cancelCallback);
    },
    cancel(reasone: any) {
      console.log("Cancel requested");
      element.removeEventListener("click", cancelCallback);
    },
  });
};

const renderStream = () => {
  return new WritableStream<Event>({
    write: (chunk) => console.log(`wrote`, chunk),
    close: () => console.log("handle render stream closed"),
  });
};

const subscribeOnce = () => {
  const stdout = renderStream();
  const writer = stdout.getWriter();
  const stream = clickStream(document.querySelector("#emit")!);
  const reader = stream.getReader();

  new Promise<void>(async () => {
    while (true) {
      const result = await reader.read();
      console.log("New value read", result);
      if (result.done) return;

      writer.write(result.value);
    }
  });

  return () => {
    console.log("Closing writer");
    writer.close();
    console.log("Cancel reader");
    reader.cancel();
  };
};

let stop = () => {};
document.querySelector("#start")!.addEventListener("click", () => {
  stop = subscribeOnce();
});

document.querySelector("#stop")!.addEventListener("click", () => {
  stop();
});
