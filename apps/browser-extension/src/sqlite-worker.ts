import { initDb } from "./modules/store/db";

console.log("hello from DB worker");

initDb("/mydb.sqlite3");
