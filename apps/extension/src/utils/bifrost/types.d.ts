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
