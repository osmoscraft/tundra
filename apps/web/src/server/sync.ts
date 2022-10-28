import { compare, getCommit, getDefaultBranch, getHistoryBase, getHistoryHead, getTree, GitHubContext } from "utils";
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
    return githubClone(remote.connection);
  }
  throw new Error("Unknown remote type");
};

export const githubClone = async (context: any) => {
  const [base, head] = await Promise.all([getHistoryBase("frames", context), getHistoryHead("frames", context)]);

  if (!base || !head) throw new Error("Remote is not setup");

  const diff = await compare(context, { base: base.sha, head: head.sha });

  console.log(diff);

  return {} as any;
};
