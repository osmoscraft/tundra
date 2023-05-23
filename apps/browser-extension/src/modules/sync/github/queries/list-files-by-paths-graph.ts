export function listFilesByPathsGraphql(pathCount: number) {
  return `
${
  pathCount > 0
    ? `fragment TreeFileContent on TreeEntry {
  object {
    ... on Blob {
      oid
      text
    }
  }
}`
    : ""
}

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
              file(path: $path${i}) {
          			...TreeFileContent
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
