export interface GetGraphStatsInput {
  db: Sqlite3.DB;
  url: string;
  linkUrls: string[];
}
export function getGraphStats(input: GetGraphStatsInput) {
  // find all nodes whose links contain the url
  // find all nodes whose url is in the linkUrls
  // find all nodes whose links contain one of the linkUrls
}
