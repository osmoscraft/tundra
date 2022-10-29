import { getCommit, getDefaultBranch, getTree, GitHubContext } from "utils";
import { RemoteSchema, RemoteType } from "./db";

export async function testConnection(context: GitHubContext) {
  const logInfo = console.log; // TODO replace with server-client streaming log
  const logError = console.error;

  try {
    const branch = await getDefaultBranch(context);
    logInfo(`[test-connection] default branch ${branch.name}`);
    if (!branch) throw new Error(`No default branch found`);

    const commit = await getCommit(context, { sha: branch.commit.sha });
    logInfo(`[test-connection] head commit tree sha ${commit.tree.sha}`);

    const rootTree = await getTree(context, { sha: commit.tree.sha });
    logInfo(`[test-connection] head commit tree ${rootTree.tree.length} items`);

    const framesTreeSha = rootTree.tree.find((node) => node.path === "frames")?.sha;
    if (!framesTreeSha) throw new Error(`Frames dir not found`);

    const framesTree = await getTree(context, { sha: framesTreeSha });
    logInfo(`[test-connection] frame tree ${framesTree.tree.length} items`);
    return true;
  } catch (e: any) {
    logError(e?.message ?? e?.name);
    return false;
  }
}

export const clone = (remote: RemoteSchema) => {
  if (remote.type === RemoteType.GitHubToken) {
    console.log("TBD");
  }
  throw new Error("Unknown remote type");
};

// Clone steps
// 1. Pick clone strategy
// 2. Get remote frames
// 3. Reconcile with empty local frames
// 4. Atomic Write to DB

export const ghListCommits = async (context: GitHubContext) => {};
