export interface PortMessage {
  channel: string;
  data: ObservedData;
  isAbort?: boolean;
  sid: string;
}

export interface ObservedData<T = any> {
  value: T;
  error?: any;
  isComplete?: boolean;
}

export type Route<T = string, K = any, Q = any> = {
  path: T;
  req?: K;
  res?: Q;
};
