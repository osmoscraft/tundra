import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkStringify from "remark-stringify";

import { Plugin, unified } from "unified";

export const markdownToHtmlPlugins = [remarkParse, remarkRehype, rehypeStringify] as Plugin[];
export const htmlToMarkdownPlugins = [rehypeParse, rehypeRemark, remarkStringify] as Plugin[];

export const getCodec = (plugins: Plugin[]) => (input: string) =>
  plugins
    .reduce((processor, plugin) => processor.use(plugin), unified())
    .process(input)
    .then((vFile) => String(vFile));
