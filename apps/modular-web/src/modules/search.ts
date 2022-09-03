import { Index } from "flexsearch";

export function getSearchModule() {
  const index = new Index();

  return {
    add: add.bind(null, index),
    remove: remove.bind(null, index),
    search: search.bind(null, index),
  };
}

export function add(index: Index, id: string, text: string) {
  return index.addAsync(id, text);
}
export function remove(index: Index, id: string) {
  return index.removeAsync(id);
}

export function search(index: Index, query: string) {
  return index.searchAsync(query);
}
