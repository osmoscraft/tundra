import type { AsyncProxy } from "@tundra/rpc-utils";
import type { DataWorkerRoutes } from "../../workers/data-worker";

export interface SaveCurrentNoteConfig {
  getContent: () => string;
  onCreated?: (node: { id: string; title?: string }) => void;
  proxy: AsyncProxy<DataWorkerRoutes>;
}

export async function saveCurrentNote({ getContent, proxy, onCreated }: SaveCurrentNoteConfig) {
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  if (!id) throw new Error("id is required for saving");

  const existingNote = await proxy.getNote(id);
  await proxy.writeNote(id, getContent());
  if (existingNote) return;

  const createdNote = await proxy.getNote(id);
  if (!createdNote) {
    console.error("Note was not created");
    return;
  }

  onCreated?.({ id: createdNote.id, title: createdNote.meta?.title });
}
