import {
  testDbCreation,
  testSchemaCanonicalStates,
  testSchemaDerivedColumns,
  testSchemaTriggerFsmDeterminism,
  testSchemaTriggerFsmSink,
} from "./db.test";
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
  testMergeFiles,
  testMetaCRUD,
  testPushFiles,
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
    testPushFiles,
    testMergeFiles,
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
    testSchemaTriggerFsmSink,
    testSchemaTriggerFsmDeterminism,
    testSchemaCanonicalStates,
    testSchemaDerivedColumns,
  ];

  for (const suite of suites) {
    console.log(`[test] ${suite.name}`);
    await suite();
  }

  console.log("[test] All done");
}
