import { Observable } from "./lib/observable";
import { clickSourceV3 } from "./lib/source";
import { counterStream, mapV2, tapV2 } from "./lib/transform";

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
