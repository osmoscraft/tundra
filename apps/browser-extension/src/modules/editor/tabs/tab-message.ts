export interface TabMessage {
  noteCreated?: {
    id: string;
    /** Title may be invalid or missing */
    title?: string;
  };
}
