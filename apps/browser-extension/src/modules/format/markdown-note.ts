export interface ParsedDocument {
  frontmatter?: DocumentHeader;
  body: string;
}

export interface DocumentHeader {
  title?: string;
  [key: string]: any;
}

const DOC_PATTERN = /^---\n([\s\S]*?)\n---([\n\s\S]*)$/;
const TITLE_PATTERN = /^title: (.*)$/m;

export function parseMarkdownNote(rawFile: string): ParsedDocument {
  const [_, frontmatterText, body] = DOC_PATTERN.exec(rawFile) ?? [];
  const frontmatter = frontmatterText ? parseFrontmatter(frontmatterText) : undefined;
  const bodyMarkdown = body !== undefined ? body : rawFile;

  return {
    frontmatter,
    body: bodyMarkdown,
  };
}

function parseFrontmatter(frontmatterText: string): DocumentHeader {
  const [_, title] = TITLE_PATTERN.exec(frontmatterText) ?? [];

  return { title };
}
