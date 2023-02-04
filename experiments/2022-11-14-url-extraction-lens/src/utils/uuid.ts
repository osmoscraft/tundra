export function uuid() {
  // TODO replacd with URL safe base64 random bytes
  return crypto.randomUUID();
}
