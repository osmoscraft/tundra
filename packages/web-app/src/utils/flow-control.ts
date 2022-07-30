export function ensure<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("The expected value is nullish");
  return value;
}
