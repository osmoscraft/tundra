export default {};

let senderObj: any;
let receiverObj: any;

interface ClockStreamOut {
  t: Date;
}

const clickStream = (element: Element) => {
  return new ReadableStream<Event>({
    start(controller) {
      element.addEventListener("click", (e) => controller.enqueue(e));
    },
  });
};

const clickStreamLazy = (element: Element) => {
  return new ReadableStream<Event>(
    {
      pull(controller) {
        console.log("pulled");
        const onClick = (e: Event) => {
          console.log("clicked", e);
          controller.enqueue(e);
        };
        element.addEventListener("click", onClick);

        return new Promise(() => {}); // never resolve
      },
    },
    { highWaterMark: 0 } // ensure no pre-queuing
  );
};

const clockStream = new ReadableStream<ClockStreamOut>({
  start(controller) {
    setInterval(() => {
      senderObj = { t: new Date() };
      controller.enqueue(senderObj);
    }, 1000);
  },
});

interface IsoDateStringStreamIn {
  t: Date;
}
interface IsoDateStringStreamOut {
  t: string;
}

const toIsoDateString = new TransformStream<IsoDateStringStreamIn, IsoDateStringStreamOut>({
  transform: (chunk, controller) => {
    controller.enqueue({
      t: chunk.t.toISOString(),
    });
  },
});

const stdout = new WritableStream<any>({
  write(chunk) {
    receiverObj = chunk;
    console.log([senderObj, receiverObj, senderObj === receiverObj]);
  },
});

const log = new WritableStream({
  write(chunk) {
    console.log(chunk);
  },
});

const limitN = (n: number) => {
  let remain = n;
  const ws = new WritableStream({
    write(chunk) {
      remain--;
      console.log("remain", remain);
      // How to stop?
    },
  });

  return ws;
};

// clockStream.pipeThrough(toIsoDateString).pipeTo(stdout);
// const click$ = clickStream(document.getElementById("emit")!);
const click$ = clickStreamLazy(document.getElementById("emit")!);
// click$.pipeTo(log);
click$.pipeTo(limitN(3));
