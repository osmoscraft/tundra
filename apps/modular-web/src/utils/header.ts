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
    dateUpdated: nowIso,
  };
}

export function getLatestTimestampHeader(header: EditorFrameHeader) {
  const nowIso = new Date().toISOString();

  return {
    ...header,
    dateUpdated: nowIso,
  };
}

export function transformHeaderBeforeCreate(frame: EditorFrame) {
  const nowIso = new Date().toISOString();

  return {
    ...frame,
    header: {
      ...frame.header,
      dateCreated: nowIso,
      dateUpdated: nowIso,
    },
  };
}

export function transformHeaderBeforeUpdate(frame: EditorFrame) {
  const nowIso = new Date().toISOString();

  return {
    ...frame,
    header: {
      ...frame.header,
      dateUpdated: nowIso,
    },
  };
}

export function getSchemaHeaderFromEditorHeader(editorHeader: EditorFrameHeader) {
  return {
    ...editorHeader,
    dateUpdated: new Date(editorHeader.dateUpdated),
    dateCreated: new Date(editorHeader.dateCreated),
  };
}

export function getEditorHeaderFromSchemaHeader(header: { dateUpdated: Date; dateCreated: Date }) {
  return {
    ...header,
    dateUpdated: header.dateUpdated.toISOString(),
    dateCreated: header.dateCreated.toISOString(),
  };
}
