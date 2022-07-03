# Sync Algorithm in JavaScript

## Context

This RFC explores a javascript implementation of [Sync Algorithm](./RFC-20220611-conflict-free-sync-algorithm.md)

## Requirements

- Server API should be compatible with both GitHub and GitLab
- Avoid client side file-system emulation
- Assume client side history-free persistence, i.e. indexed DB or sql.js

## Algorithm

Interface

```typescript
// push
function getChanges(trackedItems: TrackedItem[]): Change[];
function pushChanges(baseCommit: string, changes: Change[]): PushChangesResult;

// pull
function pullChanges(baseCommit: string, headCommit: string): Change[];
function applyChanges(changes: Change[]): TrackedItem[];

type TrackedItem = {
  id: string;
  modifiedOn: Date;
  pendingAction: "create" | "update" | "delete" | null;
  content: string | null; // null for delete
};

type Change = {
  action: "create" | "update" | "delete";
  filepath: string;
  content: string | null; // null for delete
};

type PushChangesResult = {
  headCommit: string;
};
```

Sample implemenation

```typescript
function getChanges(trackedItems) {
  return trackedItems
    .filter((item) => item.pendingAction!== null)
    .map((item) => {
      return {
        action: item.pendingAction,
        filepath: item.filepath,
        content: item.content,
      };
    });
}

function applyChanges(changes) {
  changes.map((change) => {
    switch (change.action) {
      case "create":
      case "update":
        db.upsert({
          id: change.filepath,
          content: change.content,
          syncedOn: now,
          modifiedOn: now,
        });
        break;
      case "delete":
        db.remove({
          id: change.filepath
        });
        break;
    }
  });
}

async function pullChangesFromGitHub(baseCommit, headCommit) {
  const diff = await gh.commmits.diff(baseCommit, headCommit);
  const files = diff.files.map(async file => ({
    action: mapGitHubFileStatusToChangeStatus(file.status),
    filepath: file.filename,
    content: hasContent(file.status) ? await gh.repo.content.get(file.pathname) | null, // null for delete
  }));

  return Promise.all(files);
}

async function pushChangesToGitHub(baseCommit, changes) {
  const head = await gh.refs.heads(defaultBranch).fetch();

  const blobs = changes.map(asycn (req) => req.content === null
  ? {sha: null}
  : await gh.blob.create({
    content: req.content,
  }));

  const basetree = await gh.tree.get();
  const newtree = await gh.tree.create({
    tree: blobs.map(blob => ({
      sha: blob.sha
    })),
    basetree: basetree.sha,
  });

  const commit = await gh.commits.create({
    tree: newtree.sha,
    parents: [ head.object.sha ]
  });

  await gh.refs.heads(defaultBranch).update({
    sha: commit.sha
  });

  return {
    headCommit: commit.sha
  }
}

async function pullChangesFromGitHub(baseCommit, headCommit) {
  const diff = await gh.commmits.diff(baseCommit, headCommit);
  const files = diff.files.map(async file => ({
    action: mapGitHubFileStatusToChangeStatus(file.status),
    filepath: file.filename,
    content: hasContent(file.status) ? await gh.repo.content.get(file.pathname) | null, // null for delete
  }));

  return Promise.all(files);
}

async function pullChangesFromGitLab(baseCommit, headCommit) {
  const diff = await gl.repos.compare(baseCommit, headCommit);
  const files = diff.diffs.map(async (change) => ({
    action: mapGitLabDiffToChangeStatus(change),
    filepath: file.new_path,
    content: await gl.file.get(file.new_path);
  }))

  return files;
}

async function pushChangesToGitLab(baseCommit, changes) {
  const result = await gl.commit({
    branch: defaultBranch,
    actions: changes.map(req => ({
      action: req.action,
      file_path: req.filepath,
      content: req.content
    }));
  });

  return result.id
}
```

# Appendix - Server API Capabilities

## GitHub

- Reference API
  - Set the branch to point to a commit by its SHA
- Commit API
  - Append to existing commit, using SHA from a tree
  - Get the diff between two commits [gh-diff]
    - A single request can return all changed files in a single page, with SHA + filepath
- Tree API
  - CRUD for files on top of existing trees, using SHA from the blobs [gh-tree][gh-tree-impl-ref]
  - Read can be recursive
- Blob API
  - Read blob by SHA
  - Write blob and get SHA back
- Repo API
  - Get files in a directory with 1,000 limit
  - CRUD a single file

## GitLab

- Repo API
  - List tree: get all files in repo. Max 100 per page.
  - Get the diff between two commits, with all the changed filenames and limited diff string [gl-diff], with filepath, but no SHA
- Files API
  - CRUD single file [gl-file-crud]
- Branch API
  - Get lastest commit in a branch
- Commits API
  - Create commit with multiple file CRUD changes [gl-commit-files]
  - List commits
  - List the diff between a commit and its parent, with all the changed filenames and limited diff string

[gh-diff]: https://docs.github.com/en/rest/commits/commits#compare-two-commits
[gl-diff]: https://docs.gitlab.com/ee/api/repositories.html#compare-branches-tags-or-commits
[gl-file-crud]: https://docs.gitlab.com/ee/api/repository_files.html
[gh-tree]: https://docs.github.com/en/rest/git/trees#create-a-tree
[gh-tree-impl-ref]: https://gist.github.com/StephanHoyer/91d8175507fcae8fb31a
[gl-commit-files]: https://docs.gitlab.com/ee/api/commits.html#create-a-commit-with-multiple-files-and-actions
