export function listDeletedFilesByPathsGraphql(pathCount: number) {
  return `
query ListFiles($owner: String!, $repo: String!, ${[...Array(pathCount)]
    .map((_, i) => `$path${i}: String!`)
    .join(", ")}) {
  repository(owner: $owner, name: $repo) {
    defaultBranchRef {
      target {
        ... on Commit {
          oid
${[...Array(pathCount)]
  .map(
    (_, i) => `
          file${i}: history(first: 1, path: $path${i}) {
            nodes {
              committedDate
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
