import { memoizeZeroArity } from "../../utils/memoize";
import { ChangeStatus, openGraphStore } from "./graph-store";

const getStore = memoizeZeroArity(openGraphStore);

export async function putNodes(putRequests: { id: string; body: string | null }[]) {
  const store = await getStore();

  const tx = store.transaction("node", "readwrite");
  const nodeStore = tx.store;

  putRequests.forEach(async ({ id, body }) => {
    const existing = await nodeStore.get(id);
    const now = new Date();
    nodeStore.put({
      id,
      body,
      header: {
        dateCreated: existing?.header.dateCreated ?? now,
        dateUpdated: now,
      },
      targetNodeIds: [], // TODO derive
      status: ChangeStatus.Update,
      isDeleted: body === null,
    });
  });

  await tx.done;
}
