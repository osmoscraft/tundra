import { Observable } from "./lib/observable";
import { clickSourceV3, ofSource } from "./lib/source";
import { counterStream, mapAsync, mapV2, tapV2 } from "./lib/transform";

export default {};

let stop = () => {};
const click$ = new Observable(clickSourceV3(document.querySelector("#emit")!))
  .pipe(counterStream)
  .pipe(tapV2(console.log))
  .pipe(mapV2((v: any) => v + 1));

document.querySelector("#start")!.addEventListener("click", () => {
  stop = click$.subscribe(console.log);
});

document.querySelector("#stop")!.addEventListener("click", () => {
  stop();
});

const i = setInterval(() => console.log("tick"), 0);
setTimeout(() => {
  const $$ = ["A", "B", "C", "D"]
    .map((x) =>
      new Observable(ofSource(1))
        .pipe(tapV2(() => console.log(x)))
        .pipe(mapAsync((i: any) => i))
        .pipe(tapV2(() => console.log(x)))
        .pipe(mapAsync((i: any) => i))
        .pipe(tapV2(() => console.log(x)))
        .pipe(tapV2(() => console.log(x)))
    )
    .map((obs) => obs.subscribe(() => {}));
}, 10);

setTimeout(() => clearInterval(i), 100);
