export interface PortMessage {
  channel: string;
  data: ObservedData;
  isAbort?: boolean;
  sid: string;
}

export type ObservedData<T = any> = {
  value?: T;
  error?: any;
  isComplete?: boolean;
};

export type Route<PathType = string, RequestType = any, ResponseType = any> = {
  path: PathType;
  req?: RequestType;
  res?: ResponseType;
};

export type ChannelOf<T extends Route> = T extends Route<infer K> ? K : string;
export type RequestOf<T extends Route> = T extends Route<any, infer K> ? K : any;
export type ResponseOf<T extends Route> = T extends Route<any, any, infer K> ? K : any;
