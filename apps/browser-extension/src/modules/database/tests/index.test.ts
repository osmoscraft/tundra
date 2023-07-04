import {
  testFileV2Db,
  testFileV2Status,
  testFileV2StatusTransition001,
  testFileV2StatusTransition010,
  testFileV2StatusTransition011,
  testFileV2StatusTransition100,
  testFileV2StatusTransition101,
  testFileV2StatusTransition110,
  testFileV2StatusTransition111,
} from "./file-v2.test";
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
    // file v2
    testFileV2Db,
    testFileV2Status,
    testFileV2StatusTransition100,
    testFileV2StatusTransition010,
    testFileV2StatusTransition001,
    testFileV2StatusTransition101,
    testFileV2StatusTransition011,
    testFileV2StatusTransition110,
    testFileV2StatusTransition111,

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
