export interface ParsedDocument {
  frontmatter: DocumentHeader;
  body: string;
}

export interface DocumentHeader {
  title?: string;
  [key: string]: any;
}

const DOC_PATTERN = /^---\n([\s\S]*?)\n---([\n\s\S]*)$/;
const TITLE_PATTERN = /^title: (.*)$/m;

export function parseDocument(rawFile: string): ParsedDocument {
  const [_, frontmatterText, body] = DOC_PATTERN.exec(rawFile) ?? [];

  if (frontmatterText === undefined) console.warn("Document is missing frontmatter");
  if (body === undefined) console.warn("Document is missing body");

  const frontmatter = frontmatterText ? parse(frontmatterText) : {};

  return {
    frontmatter,
    body,
  };
}

export function parse(frontmatterText: string): DocumentHeader {
  const [_, title] = TITLE_PATTERN.exec(frontmatterText) ?? [];

  return { title };
}
