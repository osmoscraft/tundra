import { renderSink } from "./lib/sink";
import { clickSourceV2 } from "./lib/source";
import { counterStream, tap } from "./lib/transform";

export default {};

const cancelToken = Symbol("User cancel");
const subscribeOnce = () => {
  const abort = new AbortController();
  clickSourceV2(document.querySelector("#emit")!)
    .pipeThrough(counterStream())
    .pipeThrough(tap(console.log))
    .pipeTo(renderSink(document.querySelector("#output")!), { signal: abort.signal })
    .catch((reason) => {
      if (reason !== cancelToken) throw reason;
    });

  return () => {
    console.log("Will cancel stream");
    abort.abort(cancelToken);
  };
};

let stop = () => {};
document.querySelector("#start")!.addEventListener("click", () => {
  stop = subscribeOnce();
});

document.querySelector("#stop")!.addEventListener("click", () => {
  stop();
});
