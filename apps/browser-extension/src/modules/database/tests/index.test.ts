import {
  testBulkOperations,
  testConflictLocalWins,
  testConflictRemoteWins,
  testGetDirtyFiles,
  testGetRecentFiles,
  testLocalFileEditLifecycle,
  testLocalFirstSync,
  testRemoteFirstSync,
} from "./file.test";
import { testGraphCRUD, testGraphSearch } from "./graph.test";
import { testObjectCRUD } from "./object.test";

export async function testDatabase() {
  // graph
  await testGraphCRUD();
  await testGraphSearch();

  // file
  await testLocalFileEditLifecycle();
  await testLocalFirstSync();
  await testRemoteFirstSync();
  await testConflictRemoteWins();
  await testConflictLocalWins();
  await testGetRecentFiles();
  await testGetDirtyFiles();
  await testBulkOperations();

  // object
  await testObjectCRUD();
}
