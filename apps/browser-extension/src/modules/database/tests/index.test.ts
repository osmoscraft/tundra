import {
  testFileV2Db,
  testFileV2StatusBehind,
  testFileV2StatusSynced,
  testFileV2StatusUntracked,
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
    testFileV2StatusUntracked,
    testFileV2StatusSynced,
    testFileV2StatusBehind,

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
