import { testDbCreation, testSchemaTriggerFsm } from "./db.test";
import {
  testBulkOperations,
  testDeleteFiles,
  testGetDirtyFiles,
  testGetDirtyFilesWithIgnore,
  testGetRecentFiles,
  testGetRecentFilesWithIgnore,
  testGetRecentFilesWithScope,
  testLocalFileEditLifecycle,
  testLocalFirstSync,
  testLocalOverrideSync,
  testMetaCRUD,
  testRemoteFirstSync,
  testSearchFileContent,
  testSearchMeta,
  testSyncOverrideLocal,
} from "./graph.test";

export async function testDatabase() {
  const suites = [
    // file
    testLocalFileEditLifecycle,
    testLocalFirstSync,
    testRemoteFirstSync,
    testSyncOverrideLocal,
    testLocalOverrideSync,
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

    // db v2
    testDbCreation,
    testSchemaTriggerFsm,
  ];

  for (const suite of suites) {
    console.log(`[test] ${suite.name}`);
    await suite();
  }
}
