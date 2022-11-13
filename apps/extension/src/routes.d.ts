import type { RemoteSchema } from "./features/db";
import type { Route } from "./utils/rpc/types";

// Format: Route<Path, ReqData, ResData>
// Path naming convention
// "setXXX": one off mutation
// "getXXX": one off query
// "watchXXX": subscription of query

export type SetRemote = Route<"setRemote", RemoteSchema, void>;
export type WatchRemote = Route<"watchRemote", undefined, RemoteSchema>;
