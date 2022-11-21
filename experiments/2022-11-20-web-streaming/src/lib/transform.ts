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
