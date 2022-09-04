import { Index } from "flexsearch";
import type { FrameSchema } from "../graph/db";

export function getSearchModule() {
  const indexContainer = { index: new Index() };

  return {
    handleChange: handleChange.bind(null, indexContainer.index),
    handleDelete: handleDelete.bind(null, indexContainer.index),
    handleReset: (requests: AddRequest[]) => {
      indexContainer.index = new Index();
      handleChange(indexContainer.index, requests);
    },
    search: search.bind(null, indexContainer.index),
  };
}

export type AddRequest = Pick<FrameSchema, "id" | "body">;

export function handleChange(index: Index, requests: AddRequest[]) {
  return Promise.all(requests.map((req) => index.addAsync(req.id, req.body)));
}

export type RemoveRequest = Pick<FrameSchema, "id">;

export function handleDelete(index: Index, requests: RemoveRequest[]) {
  return Promise.all(requests.map((req) => index.removeAsync(req.id)));
}

export function search(index: Index, query: string) {
  return index.searchAsync(query);
}
