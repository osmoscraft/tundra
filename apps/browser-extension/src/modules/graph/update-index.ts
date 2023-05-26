import { getLastUpdatedTime, updateNode } from ".";
import { queryFiles } from "../file-system";

export async function updateIndex(graphDb: Sqlite3.DB, fsDb: Sqlite3.DB) {
  const graphMaxUpdatedTime = (await getLastUpdatedTime(graphDb)) ?? "0000-00-00T00:00:00Z";
  const newFiles = await queryFiles(fsDb, { minUpdatedTime: graphMaxUpdatedTime });
  console.log(`[graph] ${newFiles.length} new files`);

  for (const file of newFiles) {
    updateNode(graphDb, {
      path: file.path,
      title: file.content.slice(0, 10),
      createdTime: file.createdTime,
      updatedTime: file.updatedTime,
    });
  }
}
