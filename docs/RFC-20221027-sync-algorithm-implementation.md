# Sync Algorithm Implementation

- [Previous version](./RFC-20220703-sync-algorithm-in-js.md)

## Test auth

- GitHub
  - [Get the authenticated user](https://docs.github.com/en/rest/users/users#get-the-authenticated-user)
- GitLab
  - ?

## Test repo

- GitHub
  - [Get the repo](https://docs.github.com/en/rest/repos/repos#get-a-repository)
- GitLab
  - ?

## Clone

- GitHub
  - [List tree](https://docs.github.com/en/rest/git/trees#get-a-tree)
    - Supports recursion
    - 100,000 limit
    - Pagination by manual recursion into subtree
    - Best performance
    - Overhead: find the folder that contains desired files (should be dpeth 1)
  - [Compare head commit with base commit](https://docs.github.com/en/rest/commits/commits#compare-two-commits)
    - Limit is unknown (no documentation found)
    - Compute overhead: finding base commit (need to walk the entire history)
    - Space overhead: unwanted metadata in comparison results
  - [Get repo content](https://docs.github.com/en/rest/repos/contents#get-repository-content)
    - 1,000 limit
  - Download zip and unzip with js
    - Downloaded content contains no git database information
    - Could be a solution for import
  - GraphQL Repository query > defaultBranchRef > target (a Commit) > tree > entries > {name, object}
    - Missing recursive query capability
- GitLab
  - [List tree](https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree)
    - Supports pagination
  - [Compare head and base commits](https://docs.gitlab.com/ee/api/repositories.html#compare-branches-tags-or-commits)
  - [Download](https://docs.gitlab.com/ee/api/repositories.html#get-file-archive)
