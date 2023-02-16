# Sync Algorithm Implementation

- [Previous version](./RFC-20220703-sync-algorithm-in-js.md)

## Test auth

- GitHub
  - [Get the authenticated user](https://docs.github.com/en/rest/users/users#get-the-authenticated-user)
  - viewer query
- GitLab
  - ?

## Test repo

- GitHub
  - [Get the repo](https://docs.github.com/en/rest/repos/repos#get-a-repository)
- GitLab
  - ?

## Clone

- GitHub
  - [Download zip and unzip with js](https://docs.github.com/en/rest/repos/contents#download-a-repository-archive-tar)
    - Downloaded content contains no git database information
    - No CORS friendly API
    - GraphQL can return tarball/zip URL
    - With Browser extension CORS header override, the tarball/zip URL can be fetched in browser
      - Prefer zip to tarball due to path ambiguity in the tarball format
      - Zip output should ideally be a byte stream to optimize unzipping performance
        - Explored in /experiments/2022-11-12-gh-clone-with-untar
    - Need Web Compression API or pako.js to decompress the binary
    - Zip decompression exploration: [unzip](./RFC-20230216-unzip.md)
    - Could be a solution for manual import
  - [List tree](https://docs.github.com/en/rest/git/trees#get-a-tree)
    - Supports recursion
    - 100,000 limit (with or without recursion)
      - A maxed out tree (100k) with realistic blob content takes GitHub API 5 seconds to generate, 24.25MB payload
    - Pagination by manual recursion into subtree
      - Consider `YYYY/MM` or flat storage layout for efficient manual recursion into sub folders
    - Need to manually download all blobs
      - Neither REST nor GraphQL supports bulk blob fetching
    - Overhead: find the folder that contains desired files (should be dpeth 1)
  - [Get repo content](https://docs.github.com/en/rest/repos/contents#get-repository-content)
    - 1,000 limit
    - Does not support recursive listing
      - Does not work with fan-out folder structure
  - [Compare head commit with base commit](https://docs.github.com/en/rest/commits/commits#compare-two-commits)
    - Vulnerable to history rewrites
    - 300 files limit. [documented](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories#diff-limits). Found via manual testing. Ref: https://stackoverflow.com/questions/72405908/how-can-i-get-a-complete-list-of-changed-files-between-two-commits-in-github
    - Compute overhead: finding base commit (need to walk the entire history)
    - Need to download blobs manually, or implement diff replay algorithm
    - Space overhead: unwanted metadata in comparison results
    - Should combine with commit history ID listing to generate chunks of commits
      - Assuming file changes are mostly incremental, replaying chunks of commits is still efiicient
  - GraphQL Repository query > defaultBranchRef > target (a Commit) > tree > entries > {name, object}
    - Listing tree entries is significantly slower than REST api (10X based on testing)
    - Missing recursive query capability
  - Use server side generated map for path->blob
- GitLab
  - [GraphQL Project > Repository > Tree or PaginatedTree](https://docs.gitlab.com/ee/api/graphql/reference/#mutationcommitcreate)
    - Has recursive flag
  - [List tree](https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree)
    - Supports pagination
  - [Compare head and base commits](https://docs.gitlab.com/ee/api/repositories.html#compare-branches-tags-or-commits)
  - [Download](https://docs.gitlab.com/ee/api/repositories.html#get-file-archive)

## Fetch

- GitHub
  - [Compare head commit with base commit](https://docs.github.com/en/rest/commits/commits#compare-two-commits)
    - 300 file limit
    - Need to manually apply diffing (consider jsdiff apply patch)
    - Fallback to full clone
    - GraphQL API provides [access to first/last commit](https://stackoverflow.com/questions/45726013/how-can-i-get-last-commit-from-github-api) on default branch.
    - Can use GraphQL history query to determine upper bound for number of changed files
  - GraphQL Ref > compare
    - GraphQL doesn't appear to have commit to commit comparison. It only offers [Ref to Ref comparison.](https://docs.github.com/en/graphql/reference/objects#ref)
    - Additional metadata from local commit available via [Object field](https://github.com/orgs/community/discussions/24528)
  - Recursive list tree and find folders newer than local's head
    - Require `YYYY/MM` prefix path in storage layout
- GitLab
  - [Compare head and base commits](https://docs.gitlab.com/ee/api/repositories.html#compare-branches-tags-or-commits)
  - Recursive list tree and find folders newer than local's head
    - Require `YYYY/MM` prefix path in storage layout

## Push

- GitHub
  - [GraphQL createCommitOnBranch mutation](https://docs.github.com/en/graphql/reference/mutations#createcommitonbranch)
  - Git database API to upload blob, create tree, create commit, and update head ref
    - Too much overhead and many roundtrips
- GitLab
  - [Create commit with multiple file changes](https://docs.gitlab.com/ee/api/commits.html#create-a-commit-with-multiple-files-and-actions)
  - [Mutation.commitCreate](https://docs.gitlab.com/ee/api/graphql/reference/#mutationcommitcreate)
