import {
  testBulkOperations,
  testConflictLocalWins,
  testConflictRemoteWins,
  testDeleteFiles,
  testGetDirtyFiles,
  testGetDirtyFilesWithIgnore,
  testGetRecentFiles,
  testLocalFileEditLifecycle,
  testLocalFirstSync,
  testMetaCRUD,
  testRemoteFirstSync,
  testSearchFileContent,
  testSearchMeta,
} from "./file.test";
import { testObjectCRUD } from "./object.test";

export async function testDatabase() {
  // file
  await testLocalFileEditLifecycle();
  await testLocalFirstSync();
  await testRemoteFirstSync();
  await testConflictRemoteWins();
  await testConflictLocalWins();
  await testDeleteFiles();
  await testGetRecentFiles();
  await testGetDirtyFiles();
  await testGetDirtyFilesWithIgnore();
  await testBulkOperations();
  await testMetaCRUD();
  await testSearchMeta();
  await testSearchFileContent();

  // object
  await testObjectCRUD();
}
