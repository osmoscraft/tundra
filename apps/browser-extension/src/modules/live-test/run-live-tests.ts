import {
  testDbCreation,
  testSchemaCanonicalStates,
  testSchemaDerivedColumns,
  testSchemaTriggerFsmDeterminism,
  testSchemaTriggerFsmSink,
} from "../database/tests/db.test";
import {
  testBulkOperations,
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
  testResolveConflict,
  testSearchFileContent,
  testSearchMeta,
  testSyncOverrideLocal,
  testUntrackFiles,
} from "../database/tests/graph.test";
import { testBacklinkSearch, testBasicSearch } from "../search/tests/search.test";

export async function runLiveTests() {
  // Add tests here for debugging
  const activeSuites: any[] = [];

  const suites = activeSuites.length
    ? activeSuites
    : [
        // db v2
        testDbCreation,
        testSchemaTriggerFsmSink,
        testSchemaTriggerFsmDeterminism,
        testSchemaCanonicalStates,
        testSchemaDerivedColumns,

        // file
        testLocalFileEditLifecycle,
        testLocalFirstSync,
        testRemoteFirstSync,
        testSyncOverrideLocal,
        testLocalOverrideSync,
        testUntrackFiles,
        testPushFiles,
        testMergeFiles,
        testResolveConflict,
        testGetRecentFiles,
        testGetRecentFilesWithScope,
        testGetRecentFilesWithIgnore,
        testGetDirtyFiles,
        testGetDirtyFilesWithIgnore,
        testBulkOperations,
        testMetaCRUD,
        testSearchMeta,
        testSearchFileContent,

        // search
        testBasicSearch,
        testBacklinkSearch,
      ];

  for (const suite of suites) {
    console.log(`[test] ${suite.name}`);
    await suite();
  }

  console.log("[test] All done");
}
