export const internalQuery = (query: string) =>
  query
    .replace(/[\'"]/g, "")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => `"${word}"*`)
    .join(" ");
