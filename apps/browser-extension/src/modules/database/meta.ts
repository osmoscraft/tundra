import yaml from "yaml";

export type Meta = Record<string, any>;
export interface WithEncodedMeta {
  meta: string | null;
}
export type WithDecodedMeta<T extends WithEncodedMeta> = Omit<T, "meta"> & { meta: Meta | null };
export function decodeMeta<T extends WithEncodedMeta>(withEncodedMeta: T): WithDecodedMeta<T> {
  return {
    ...withEncodedMeta,
    meta: withEncodedMeta.meta !== null ? JSON.parse(withEncodedMeta.meta) : null,
  };
}

export interface EncodableFile {
  path: string;
  content: string | null;
}
export function encodeMeta(file: EncodableFile): string | null {
  return file.content === null ? null : JSON.stringify(getMetaExtractor(file.path)(file.content));
}

export type MetaExtractor = (content: string) => Record<string, any>;

export interface NoteMeta {
  title?: string;
}

export function getMetaExtractor(path: string): MetaExtractor {
  if (path.endsWith(".md")) return extractMarkdownMeta;
  else if (path.endsWith(".gitignore")) return extractIgnoreMeta;
  else return emptyMetaExtractor;
}

const DOC_PATTERN = /^---\n([\s\S]*?)\n---/;
export function extractMarkdownMeta(rawFile: string): NoteMeta {
  const [_, frontmatterText] = DOC_PATTERN.exec(rawFile) ?? [];
  const frontmatter = frontmatterText ? parseFrontmatter(frontmatterText) : {};

  return frontmatter;
}

function parseFrontmatter(frontmatterText: string): NoteMeta {
  const result = yaml.parse(frontmatterText) as NoteMeta;
  return result;
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

export function emptyMetaExtractor() {
  return {};
}
