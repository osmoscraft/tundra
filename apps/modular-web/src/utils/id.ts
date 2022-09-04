export function getNewId() {
  return crypto.randomUUID();
}

// e.g. "frames/abc-123.md" => "abc-123"
export function filePathToId(filename: string) {
  const start = filename.lastIndexOf("/") + 1;
  const end = filename.lastIndexOf(".md") ?? filename.length;
  return filename.slice(start, end);
}

// e.g. "abc-123" => "abc-123.md"
export function idToFilename(id: string) {
  return `${id}.md`;
}
