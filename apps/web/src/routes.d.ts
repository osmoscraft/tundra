import type { RouteHandler } from "utils";
import type { RemoteSchema } from "./server/db";

export type AppRoutes = {
  echo: RouteHandler<EchoReq, EchoRes>;
  getRemote: RouteHandler<undefined, RemoteSchema | null>;
  setRemote: RouteHandler<RemoteSchema, undefined>;
};

export interface EchoReq {
  message: string;
}
export interface EchoRes {
  message: string;
}
