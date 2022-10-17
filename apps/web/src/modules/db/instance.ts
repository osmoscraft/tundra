import { migrate, openDB } from "./db";
import { migration01, migration02, migration03 } from "./migrations";

export const dbAsync = openDB("tinky-store", 3, migrate([migration01, migration02, migration03]));
