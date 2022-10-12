export function splitByFence(fileContent: string): [string, string] {
  const [_start, header, ...body] = fileContent.split("---");
  return [header.trim(), body.join("---").trim()];
}

export function joinByFence(header: string, body: string): string {
  return `---\n${header.trim()}\n---\n${body.trim()}`;
}
