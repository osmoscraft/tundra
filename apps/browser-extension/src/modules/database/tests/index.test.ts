import {
  testBulkOperations,
  testConflictLocalWins,
  testConflictRemoteWins,
  testGetDirtyFiles,
  testGetRecentFiles,
  testLocalFileEditLifecycle,
  testLocalFirstSync,
  testMetaCRUD,
  testRemoteFirstSync,
  testSearchFileContent,
  testSearchMeta,
} from "./file.test";
import { testGraphCRUD, testSearchNodes } from "./graph.test";
import { testObjectCRUD } from "./object.test";

export async function testDatabase() {
  // graph
  await testGraphCRUD();
  await testSearchNodes();

  // file
  await testLocalFileEditLifecycle();
  await testLocalFirstSync();
  await testRemoteFirstSync();
  await testConflictRemoteWins();
  await testConflictLocalWins();
  await testGetRecentFiles();
  await testGetDirtyFiles();
  await testBulkOperations();
  await testMetaCRUD();
  await testSearchMeta();
  await testSearchFileContent();

  // object
  await testObjectCRUD();
}
