export type MetaParser = (content: string) => any;

export interface DocumentHeader {
  title?: string;
  [key: string]: any;
}

export function getMetaParser(path: string): MetaParser {
  if (path.endsWith(".md")) return (content) => parseMarkdownMeta(content);
  else if (path.endsWith(".json")) return (content) => JSON.parse(content);
  // TODO implement ignore pattern
  else if (path.endsWith(".gitignore")) return (content) => ({ match: [...content.split("\n")], negate: [] });
  else throw new Error(`Unknown file type: ${path}`);
}

const DOC_PATTERN = /^---\n([\s\S]*?)\n---/;
const TITLE_PATTERN = /^title: (.*)$/m;

export function parseMarkdownMeta(rawFile: string): DocumentHeader | undefined {
  const [_, frontmatterText] = DOC_PATTERN.exec(rawFile) ?? [];
  const frontmatter = frontmatterText ? parseFrontmatter(frontmatterText) : undefined;

  return frontmatter;
}

function parseFrontmatter(frontmatterText: string): DocumentHeader {
  const [_, title] = TITLE_PATTERN.exec(frontmatterText) ?? [];

  return { title };
}
