import type { HeaderSchema } from "../db/db";

export type EditorFrame = {
  header: EditorFrameHeader;
  body: EditorFrameBody;
};
export type EditorFrameHeader = Record<string, any>;
export type EditorFrameBody = string;

export function generateInitialHeader(): EditorFrameHeader {
  const nowIso = new Date().toISOString();

  return {
    dateCreated: nowIso,
    dateModified: nowIso,
  };
}

export function getLatestTimestampHeader(header: EditorFrameHeader) {
  const nowIso = new Date().toISOString();

  return {
    ...header,
    dateModified: nowIso,
  };
}

export function transformHeaderBeforeCreate(frame: EditorFrame) {
  const nowIso = new Date().toISOString();

  return {
    ...frame,
    header: {
      ...frame.header,
      dateCreated: nowIso,
      dateModified: nowIso,
    },
  };
}

export function transformHeaderBeforeUpdate(frame: EditorFrame) {
  const nowIso = new Date().toISOString();

  return {
    ...frame,
    header: {
      ...frame.header,
      dateModified: nowIso,
    },
  };
}

export function getSchemaHeaderFromEditorHeader(editorHeader: EditorFrameHeader) {
  return {
    ...editorHeader,
    dateModified: new Date(editorHeader.dateModified),
    dateCreated: new Date(editorHeader.dateCreated),
  };
}

export function getEditorHeaderFromSchemaHeader(schemaHeader: HeaderSchema) {
  return {
    ...schemaHeader,
    dateModified: schemaHeader.dateModified.toISOString(),
    dateCreated: schemaHeader.dateCreated.toISOString(),
  };
}
