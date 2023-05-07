export type Fn<ArgsType extends any[] = any[], ReturnType = any> = (...args: ArgsType) => ReturnType;

export type AsyncProxy<FnsMap> = {
  [K in keyof FnsMap]: FnsMap[K] extends Fn<infer ArgsType, infer ReturnType>
    ? Fn<ArgsType, Promise<Awaited<ReturnType>>>
    : never;
};

export interface IPort {
  emit: (message: IPortMessage) => any;
  on: (callback: (message: IPortMessage) => void) => void;
  off: (callback: (message: IPortMessage) => void) => void;
}

export interface IPortMessage {
  header: {
    mid: string;
  };
  payload: any;
}
