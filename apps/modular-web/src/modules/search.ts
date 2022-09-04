import { Index } from "flexsearch";
import type { FileSchema } from "./file";

export function getSearchModule() {
  const index = new Index();

  return {
    handleChange: handleChange.bind(null, index),
    handleDelete: handleDelete.bind(null, index),
    search: search.bind(null, index),
  };
}

export type AddRequest = Pick<FileSchema, "id" | "body">;

export function handleChange(index: Index, requests: AddRequest[]) {
  return Promise.all(requests.map((req) => index.addAsync(req.id, req.body)));
}

export type RemoveRequest = Pick<FileSchema, "id">;

export function handleDelete(index: Index, requests: RemoveRequest[]) {
  return Promise.all(requests.map((req) => index.removeAsync(req.id)));
}

export function search(index: Index, query: string) {
  return index.searchAsync(query);
}
