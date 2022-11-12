import type { HeaderSchema } from "../graph/db";

export type EditorFrame = {
  header: EditorFrameHeader;
  body: EditorFrameBody;
};
export type EditorFrameHeader = Record<string, any>;
export type EditorFrameBody = string;

export function getSchemaHeaderFromEditorHeader(editorHeader: EditorFrameHeader) {
  return {
    ...editorHeader,
    dateUpdated: new Date(editorHeader.dateUpdated),
    dateCreated: new Date(editorHeader.dateCreated),
  };
}

export function getEditorHeaderFromSchemaHeader(schemaHeader: HeaderSchema) {
  return {
    ...schemaHeader,
    dateUpdated: schemaHeader.dateUpdated.toISOString(),
    dateCreated: schemaHeader.dateCreated.toISOString(),
  };
}
