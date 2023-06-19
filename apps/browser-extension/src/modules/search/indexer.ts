export interface ParsedDocument {
  frontmatter: DocumentHeader;
  body: string;
}

const DOC_PATTERN = /^---\n([\s\S]*?)\n---([\n\s\S]*)$/;
const TITLE_PATTERN = /^title: (.*)$/m;

export function parseDocument(rawFile: string): ParsedDocument {
  const [_, frontmatterText, body] = DOC_PATTERN.exec(rawFile) ?? [];

  if (frontmatterText === undefined) throw new Error("Document is missing frontmatter");
  if (body === undefined) throw new Error("Document is missing body");

  const frontmatter = ensureHeaderFields(parse(frontmatterText));

  return {
    frontmatter,
    body,
  };
}

export interface DocumentHeader {
  title: string;
}
export function ensureHeaderFields(maybeFrontmatter: any): DocumentHeader {
  if (!maybeFrontmatter?.title) throw new Error("Document is missing title", maybeFrontmatter);

  return {
    title: maybeFrontmatter.title,
  };
}

export function parse(frontmatterText: string): DocumentHeader {
  const [_, title] = TITLE_PATTERN.exec(frontmatterText) ?? [];

  return { title };
}
