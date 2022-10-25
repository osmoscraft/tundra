import { getCommit, getDefaultBranch, getTree } from "../utils/github/api";
import type { GitHubContext } from "../utils/github/context";

export async function testConnection(log: (message: string) => any, context: GitHubContext) {
  try {
    const branch = await getDefaultBranch(context);
    log(`[test-connection] default branch ${branch.name}`);
    if (!branch) throw new Error(`No default branch found`);

    const commit = await getCommit(context, { sha: branch.commit.sha });
    log(`[test-connection] head commit tree sha ${commit.tree.sha}`);

    const rootTree = await getTree(context, { sha: commit.tree.sha });
    log(`[test-connection] head commit tree ${rootTree.tree.length} items`);

    const framesTreeSha = rootTree.tree.find((node) => node.path === "frames")?.sha;
    if (!framesTreeSha) throw new Error(`Frames dir not found`);

    const framesTree = await getTree(context, { sha: framesTreeSha });
    log(`[test-connection] frame tree ${framesTree.tree.length} items`);
    return framesTree.tree;
  } catch (e: any) {
    log(e?.message ?? e?.name);
    return;
  }
}
