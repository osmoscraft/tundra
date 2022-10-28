import type { RouteHandler } from "utils";
import type { RemoteSchema } from "./server/db";

export type AppRoutes = {
  echo: RouteHandler<EchoReq, EchoRes>;
  getRemote: RouteHandler<undefined, RemoteSchema | null>;
  setRemote: RouteHandler<RemoteSchema, undefined>;
  testRemote: RouteHandler<RemoteSchema, boolean>;
  gitClone: RouteHandler<undefined, any>;
};

export interface EchoReq {
  message: string;
}
export interface EchoRes {
  message: string;
}
