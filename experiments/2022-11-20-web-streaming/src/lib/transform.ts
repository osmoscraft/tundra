export const counterStream = () => {
  let count = 0;
  return new TransformStream<any, number>({
    transform: (_chunk, controller) => {
      if (count > 3) {
        controller.error(new Error("Test error behavior"));
      }
      controller.enqueue(++count);
    },
  });
};

export const tap = (fn: any) => {
  return new TransformStream({
    transform: (value, controller) => {
      fn(value);
      controller.enqueue(value);
    },
  });
};

export const map = <In = any, Out = any>(fn: any, streamIn: ReadableStream<In>) => {
  const transform = new TransformStream<In, Out>({
    transform: (value, controller) => {
      controller.enqueue(fn(value));
    },
  });

  return streamIn.pipeThrough(transform);
};

export const mapV2 = (fn: any) => () => {
  return new TransformStream({
    transform: (value, controller) => {
      controller.enqueue(fn(value));
    },
  });
};

export const tapV2 = (fn: any) => () => {
  return new TransformStream({
    transform: (value, controller) => {
      fn(value);
      controller.enqueue(value);
    },
  });
};
