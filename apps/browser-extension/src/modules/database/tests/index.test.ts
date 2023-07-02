import {
  testBulkOperations,
  testConflictLocalWins,
  testConflictRemoteWins,
  testDeleteFiles,
  testGetDirtyFiles,
  testGetDirtyFilesWithIgnore,
  testGetRecentFiles,
  testGetRecentFilesWithIgnore,
  testGetRecentFilesWithScope,
  testLocalFileEditLifecycle,
  testLocalFirstSync,
  testMetaCRUD,
  testRemoteFirstSync,
  testSearchFileContent,
  testSearchMeta,
} from "./graph.test";

export async function testDatabase() {
  // file
  await testLocalFileEditLifecycle();
  await testLocalFirstSync();
  await testRemoteFirstSync();
  await testConflictRemoteWins();
  await testConflictLocalWins();
  await testDeleteFiles();
  await testGetRecentFiles();
  await testGetRecentFilesWithScope();
  await testGetRecentFilesWithIgnore();
  await testGetDirtyFiles();
  await testGetDirtyFilesWithIgnore();
  await testBulkOperations();
  await testMetaCRUD();
  await testSearchMeta();
  await testSearchFileContent();
}
