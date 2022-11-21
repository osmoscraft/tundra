export const logSink = () =>
  new WritableStream<any>({
    write: (v, _controller) => console.log(v),
    close: () => {}, //noop
  });

export const renderSink = (target: Element) =>
  new WritableStream({
    write: (value, _controller) => (target.innerHTML = value),
    close: () => {}, // noop
  });
