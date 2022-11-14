import type { RemoteSchema } from "./features/db";
import type { LogEntry } from "./features/log";
import type { Route } from "./utils/rpc/types";

// Format: Route<Path, ReqData, ResData>
// Path naming convention
// <entity>/<verb>

export type EchoGet = Route<"echo/get", any, any>;
export type LogWatch = Route<"log/watch", undefined, LogEntry>;
export type RemoteUpdate = Route<"remote/update", RemoteSchema, void>;
export type RemoteWatch = Route<"remote/watch", undefined, RemoteSchema | null>;
export type RepoTest = Route<"repo/test", RemoteSchema, boolean>;
export type RepoClone = Route<"repo/clone", any, any>;
