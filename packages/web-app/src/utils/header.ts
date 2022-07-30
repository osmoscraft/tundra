import type { SchemaHeader } from "../db/db";

export type EditorFrame = {
  header: EditorFrameHeader;
  body: EditorFrameBody;
};
export type EditorFrameHeader = Record<string, any>;
export type EditorFrameBody = string;

export function transformHeaderBeforeCreate(frame: EditorFrame) {
  const nowIso = new Date().toISOString();

  return {
    ...frame,
    header: {
      ...frame.header,
      btime: nowIso,
      ctime: nowIso,
    },
  };
}

export function transformHeaderBeforeUpdate(frame: EditorFrame) {
  const nowIso = new Date().toISOString();

  return {
    ...frame,
    header: {
      ...frame.header,
      ctime: nowIso,
    },
  };
}

export function getSchemaHeaderFromEditorHeader(editorHeader: EditorFrameHeader) {
  return {
    ...editorHeader,
    ctime: new Date(editorHeader.ctime),
    btime: new Date(editorHeader.btime),
  };
}

export function getEditorHeaderFromSchemaHeader(schemaHeader: SchemaHeader) {
  return {
    ...schemaHeader,
    ctime: schemaHeader.ctime.toISOString(),
    btime: schemaHeader.btime.toISOString(),
  };
}
