export function tokenize(input: string) {
  return [...new Intl.Segmenter(undefined, { granularity: "word" }).segment(input)]
    .map((segment) => segment.segment)
    .filter((segment) => segment.trim().length);
}
