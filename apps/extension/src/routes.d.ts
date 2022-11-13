import type { RouteHandler } from "./utils/worker-rpc";

export type AppRoutes = {
  echo: RouteHandler<EchoReq, EchoRes>;
  gitClone: RouteHandler<undefined, any>;
};

export interface EchoReq {
  message: string;
}
export interface EchoRes {
  message: string;
}
