import { testDbCreation, testSchemaTriggerFsm } from "./db.test";
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
  const suites = [
    // db v2
    testDbCreation,
    testSchemaTriggerFsm,

    // file
    testLocalFileEditLifecycle,
    testLocalFirstSync,
    testRemoteFirstSync,
    testConflictRemoteWins,
    testConflictLocalWins,
    testDeleteFiles,
    testGetRecentFiles,
    testGetRecentFilesWithScope,
    testGetRecentFilesWithIgnore,
    testGetDirtyFiles,
    testGetDirtyFilesWithIgnore,
    testBulkOperations,
    testMetaCRUD,
    testSearchMeta,
    testSearchFileContent,
  ];

  for (const suite of suites) {
    console.log(`[test] ${suite.name}`);
    await suite();
  }
}
