import { ensure } from "../../utils/flow-control";
import { ChangeType, getAppDB, openAppDB } from "../db/db";
import { applyDrafts, applyFrameChanges, getDraftFrames, getLocalBaseCommit, resetDb } from "../db/queries";
import { getGitHubContext } from "../sync/github/context";
import { fetch, getRemoteAll, push, testConnection } from "../sync/sync";

export type LogFunction = (message: string) => any;

export async function handleTestConnection(log: LogFunction) {
  log("Test started");
  const context = await getGitHubContext();
  if (!context) return;
  const framesTree = await testConnection(context);
  log(`Found ${framesTree?.length} trees`);
}

export async function handleStatus(log: LogFunction) {
  const db = await openAppDB();

  const drafts = await getDraftFrames(db);
  const creatCount = drafts.filter((item) => item.changeType === ChangeType.Create).length;
  const updateCount = drafts.filter((item) => item.changeType === ChangeType.Update).length;
  const deleteCount = drafts.filter((item) => item.changeType === ChangeType.Delete).length;
  log(`${creatCount} new | ${updateCount} update | ${deleteCount} delete`);
}

export async function handleClone(log: LogFunction) {
  log("Clone started");
  const context = ensure(await getGitHubContext());
  const remoteAll = await getRemoteAll(context);
  const db = await openAppDB();
  resetDb(db, remoteAll.frames, remoteAll.sha);
  log(`Cloned ${remoteAll.frames.length} items, sha: ${remoteAll.sha}`);

  window.confirm("Reload now?") && location.reload();
}

export async function handleFetch(log: LogFunction) {
  log(`Fetch started`);
  const db = await getAppDB();
  const result = await fetch(ensure(await getGitHubContext()), ensure(await getLocalBaseCommit(db)));
  log(`${result?.changes.length ?? 0} changes`);
}

export async function handlePull(log: LogFunction) {
  log(`Pull started`);
  const db = await getAppDB();
  const result = await fetch(ensure(await getGitHubContext()), ensure(await getLocalBaseCommit(db)));
  log(`${result?.changes.length ?? 0} changes`);
  result && (await applyFrameChanges(db, result.changes, result.headCommit));
}

export async function handlePush(log: LogFunction) {
  log(`Push started`);
  const db = await getAppDB();
  const drafts = await getDraftFrames(db);
  const pushResult = await push(ensure(await getGitHubContext()), drafts);
  log(`Pushed ${pushResult?.commitSha}`);
  if (!pushResult) return;
  await applyDrafts(db, drafts, pushResult.commitSha);
  log(`db updated ${drafts.length}`);
  if (window.confirm("Reload now?")) {
    location.reload();
  }
}
