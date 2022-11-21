export default {};

interface ObservableValue {
  unsub: () => any;
  value: any;
}

const clickStreamLazy = (element: Element) => {
  const rs = new ReadableStream<ObservableValue>(
    {
      pull(controller) {
        console.log("pulled");

        const sub = new Promise<void>((resolve) => {
          const onCancel = () => {
            element.removeEventListener("click", onClick);
          };

          const onClick = (e: Event) => {
            console.log("clicked", e);
            controller.enqueue({
              unsub: onCancel,
              value: e,
            });
          };

          element.addEventListener("click", onClick);
        });

        return sub;
      },
    },
    { highWaterMark: 0 } // ensure no pre-queuing
  );

  return rs;
};

const tapLog = new TransformStream<ObservableValue, ObservableValue>({
  transform(chunk, controller) {
    console.log("log", chunk);
    controller.enqueue(chunk);
  },
});

// const log = new WritableStream({
//   write(chunk) {
//     console.log("log", chunk);
//   },
// });

const limitN = (n: number) => {
  let remain = n;
  const ws = new WritableStream<ObservableValue>({
    write(chunk) {
      remain--;
      console.log("remain", remain);
      console.log("value", chunk.value);
      // How to stop?
      if (remain === 0) {
        chunk.unsub();
      }
    },
  });

  return ws;
};

// clockStream.pipeThrough(toIsoDateString).pipeTo(stdout);
// const click$ = clickStream(document.getElementById("emit")!);
const click$ = clickStreamLazy(document.getElementById("emit")!);
click$.pipeThrough(tapLog).pipeTo(limitN(3));
// click$.pipeTo(limitN(3));
