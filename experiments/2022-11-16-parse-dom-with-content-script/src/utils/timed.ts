export function timed<T extends any[], K>(task: (...args: T) => K, measureName = "Duration") {
  return (...args: T) => {
    const startMark = Math.random().toString();
    performance.mark(startMark);
    const t = task(...args);
    console.log(`${measureName}: ${performance.measure(measureName, startMark).duration.toFixed(2)} ms`);
    return t;
  };
}
