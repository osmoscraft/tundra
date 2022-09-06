import { compare, CompareResultFile, getBlob, getCommit, getDefaultBranch, getTree, listCommits } from "../git/github-api";
import { getGitHubContext, GitHubContext } from "../git/github-context";
import { b64DecodeUnicode } from "../utils/base64";
import { filePathToId } from "../utils/filename";
import { ensure } from "../utils/flow-control";

export interface ISyncModule {
  addLocal(changes: LocalChange[]): void;
  clone(): any;
  fetch(): any;
  push(): void;
  on<Type extends keyof ChangesetEventMap>(type: Type, listener: (data: ChangesetEventMap[Type]) => any): void;
}

export interface LocalChange {
  id: string;
  prevContent: string | null;
  content: string | null;
}

export interface RemoteChange {
  id: string;
  content: string | null;
}

export interface ChangesetEventMap {
  localChanged: any;
  remoteChanged: any;
}

export class GitHubSyncModule implements ISyncModule {
  private events = new EventTarget();
  private localHeadRef: string | null = null;
  private localChanges: LocalChange[] = [];
  private remoteChanges: RemoteChange[] = [];

  addLocal(changes: LocalChange[]): void {
    changes.forEach((change) => {
      const existingItem = this.localChanges.find((item) => item.id === change.id);
      if (existingItem) {
        existingItem.content = change.content;
      } else {
        this.localChanges.push(change);
      }
    });
  }

  async test() {
    const context = ensure(await getGitHubContext());
    const branch = await getDefaultBranch(context);
    console.log(`[test-connection] default branch ${branch.name}`);
    if (!branch) return;

    const commit = await getCommit(context, { sha: branch.commit.sha });
    console.log(`[test-connection] head commit tree sha ${commit.tree.sha}`);

    const rootTree = await getTree(context, { sha: commit.tree.sha });
    console.log(`[test-connection] head commit tree`, rootTree.tree);

    const framesTreeSha = rootTree.tree.find((node) => node.path === "frames")?.sha;
    if (!framesTreeSha) return;

    const framesTree = await getTree(context, { sha: framesTreeSha });
    console.log(`[test-connection]`, framesTree.tree);
  }

  async clone() {
    const context = ensure(await getGitHubContext());
    const [base, head] = await Promise.all([this.getRemoteInitialCommit(context), this.getRemoteHeadCommit(context)]);
    if (!base || !head) return;

    const diff = await compare(context, { base: base.sha, head: head.sha });

    this.remoteChanges = await Promise.all(
      diff.files
        .filter((file) => file.filename.startsWith("frames"))
        .filter((file) => file.status === "added")
        .map(this.compareResultFileToChange.bind(null, context))
    );

    this.events.dispatchEvent(new CustomEvent("remoteChanged", { detail: this.remoteChanges }));
  }

  async fetch() {
    const context = ensure(await getGitHubContext());
    const [base, head] = await Promise.all([this.getLocalBaseCommit(), this.getRemoteHeadCommit(context)]);
    if (!base || !head) return;

    const diff = await compare(context, { base, head: head.sha });

    this.remoteChanges = await Promise.all(
      diff.files.filter((file) => file.filename.startsWith("frames")).map(this.compareResultFileToChange.bind(null, context))
    );

    this.events.dispatchEvent(new CustomEvent("remoteChanged", { detail: this.remoteChanges }));
  }

  push(): void {}

  on<Type extends keyof ChangesetEventMap>(type: Type, listener: (data: ChangesetEventMap[Type]) => any): void {
    const wrappedListener = ((e: CustomEvent) => listener(e.detail)) as EventListener;
    this.events.addEventListener(type, wrappedListener);
  }

  private async getRemoteInitialCommit(context: GitHubContext) {
    const baseCommit = [...(await listCommits(context, { path: ".tinykb" }))].pop();
    return baseCommit;
  }

  private async getLocalBaseCommit() {
    return this.localHeadRef;
  }

  private async getRemoteHeadCommit(context: GitHubContext) {
    const headCommit = (await listCommits(context)).at(0);
    return headCommit;
  }

  private async compareResultFileToChange(context: GitHubContext, file: CompareResultFile) {
    return {
      status: file.status,
      filename: file.filename,
      id: filePathToId(file.filename),
      content: file.status === "removed" ? null : b64DecodeUnicode((await getBlob(context, { sha: file.sha })).content),
    };
  }
}
