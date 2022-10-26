import type { RouteHandler } from "utils";
export type AppRoutes = {
  echo: RouteHandler<EchoReq, EchoRes>;
};

export interface EchoReq {
  message: string;
}
export interface EchoRes {
  message: string;
}
