import MATCH_NODES_BY_LINK_URLS from "../db/statements/match-nodes-by-link-urls.sql";
import MATCH_NODES_BY_URLS from "../db/statements/match-nodes-by-urls.sql";

export interface GetGraphStatsInput {
  db: Sqlite3.DB;
  url: string;
  linkUrls: string[];
}

export interface GraphStats {
  inNodes: any[];
  outCapturedNodes: any[];
  outSharedNodes: any[];
}

export function getGraphStats(input: GetGraphStatsInput): GraphStats {
  // find all nodes whose links contain the url
  const inNodes = input.db.selectObjects(MATCH_NODES_BY_LINK_URLS, {
    ":urlList": `"${input.url}"`,
  });

  // find all nodes whose url is in the linkUrls
  const outCapturedNodes = input.linkUrls.length
    ? input.db.selectObjects(MATCH_NODES_BY_URLS, {
        ":urlList": input.linkUrls.map((url) => `"${url}"`).join(" OR "),
      })
    : [];

  // find all nodes whose links contain one of the linkUrls
  const outSharedNodes = (
    input.linkUrls.length
      ? input.db.selectObjects<{ path: string; url: string; content: string }>(MATCH_NODES_BY_LINK_URLS, {
          ":urlList": input.linkUrls.map((url) => `"${url}"`).join(" OR "),
        })
      : []
  )
    .filter((node) => node.url !== input.url)
    .map((result) => JSON.parse(result.content)); // self

  return {
    inNodes,
    outCapturedNodes,
    outSharedNodes,
  };
}
