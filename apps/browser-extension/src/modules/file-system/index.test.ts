import { destoryFileSystemDb, initFileSystemDb } from ".";

export async function testFileSystemCreation() {
  await initFileSystemDb("/test.db");
  await destoryFileSystemDb("/test.db");
}

export async function testFileSystemSchema() {
  const db = await initFileSystemDb("/test.db");
  // TODO add test
}
