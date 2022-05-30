export type RequestRoutes = {
  "parse-document-html": [input: ParseDocumentHtmlInput, output: ParseDocumentHtmlOutput];
};
export interface ParseDocumentHtmlInput {
  html: string;
}
export interface ParseDocumentHtmlOutput {
  title: string;
}
