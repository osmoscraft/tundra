export function listFilesByPathsGraphql(pathCount: number) {
  return `
query ListFiles($owner: String!, $repo: String!, $path0: String!) {
  repository(owner: $owner, name: $repo) {
    defaultBranchRef {
      target {
        ... on Commit {
          oid
${[...Array(pathCount)]
  .map(
    (path, i) => `
          file${i}: history(first: 1, path: $path${i}) {
            nodes {
              committedDate
              file(path: $path${i}) {
          			object {
                  ... on Blob {
                    text
                  }
                }
              }
            }
          }
`
  )
  .join("\n")}
        }
      }
    }
  }
}`;
}
