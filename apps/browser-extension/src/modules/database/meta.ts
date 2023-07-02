export interface WithMeta {
  meta: string | null;
}
export function decodeMeta<T extends WithMeta>(withMeta: T) {
  return {
    ...withMeta,
    meta: withMeta.meta !== null ? JSON.parse(withMeta.meta) : {},
  };
}

export type MetaExtractor = (content: string) => any;

export interface NoteMeta {
  title?: string;
}

export function getMetaExtractor(path: string): MetaExtractor {
  if (path.endsWith(".md")) return extractMarkdownMeta;
  else if (path.endsWith(".gitignore")) return extractIgnoreMeta;
  else return nullParser;
}

const DOC_PATTERN = /^---\n([\s\S]*?)\n---/;
const TITLE_PATTERN = /^title: (.*)$/m;

export function extractMarkdownMeta(rawFile: string): NoteMeta | undefined {
  const [_, frontmatterText] = DOC_PATTERN.exec(rawFile) ?? [];
  const frontmatter = frontmatterText ? parseFrontmatter(frontmatterText) : undefined;

  return frontmatter;
}

function parseFrontmatter(frontmatterText: string): NoteMeta {
  const [_, title] = TITLE_PATTERN.exec(frontmatterText) ?? [];

  return { title };
}

export interface IgnoreNeta {
  match: string[];
  negate: string[];
}
function extractIgnoreMeta(rawFile: string): IgnoreNeta {
  return rawFile.split("\n").reduce<IgnoreNeta>(
    (acc, line) => {
      if (line.startsWith("#")) return acc;
      if (line.startsWith("!")) acc.negate.push(line.slice(1));
      else if (line.length) acc.match.push(line);
      return acc;
    },
    { match: [], negate: [] }
  );
}

function nullParser() {
  return null;
}
