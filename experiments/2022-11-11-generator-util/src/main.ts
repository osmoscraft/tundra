const src = document.querySelector<HTMLButtonElement>("#src")!;

function* BaseGen(onNext: (...args: any[]) => any): Generator<void> {
  while (true) {
    onNext(yield);
  }
}

function* Counter(onNext: (count: number) => any): Generator<void> {
  let count = 0;
  while (true) {
    count++;
    yield;
    onNext(count);
  }
}

function* Render(element: Element): Generator<any, any, string> {
  while (true) {
    const value = yield;
    element.innerHTML = `${value}`;
  }
}

function Channel(transform: (...args: any[]) => any) {
  let subscriber: any = () => {};

  function* Gen(): Generator<any> {
    while (true) {
      const v = yield;
      const t = transform(v);
      subscriber(t);
    }
  }

  const g = Gen();

  return {
    subscribe: (subFn: any) => {
      subscriber = subFn;
      g.next();
    },
    send: (value: any) => g.next(value),
  };
}

export async function main() {
  const render = Render(document.getElementById("output")!);
  const ctr = Counter((counter: number) => render.next(counter.toString()));
  const baseGen = BaseGen(() => ctr.next());

  const ch1 = Channel((i) => i + 1);
  ch1.subscribe(console.log);
  ch1.send(1);
  ch1.send(2);
  ch1.send(3);

  src.addEventListener("click", (e) => baseGen.next(0));
}

main();
