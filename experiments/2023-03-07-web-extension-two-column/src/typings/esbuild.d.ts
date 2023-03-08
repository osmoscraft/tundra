declare module "*.sql" {
  const content: string;
  export default content;
}

declare module "*.graphql" {
  const content: string;
  export default content;
}

declare module "*/sqlite3/sqlite3.mjs" {
  const apiInitializer: () => Promise<Sqlite3.ApiIndex>;
  export default apiInitializer;
}
