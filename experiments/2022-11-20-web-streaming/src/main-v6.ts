import { logSink } from "./lib/sink";
import { clickSource } from "./lib/source";
import { counterStream } from "./lib/transform";

export default {};

const cancelToken = Symbol("User cancel");

const subscribeOnce = () => {
  const abort = new AbortController();
  clickSource(document.querySelector("#emit")!)
    .pipeThrough(counterStream())
    .pipeTo(logSink(), { signal: abort.signal })
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
