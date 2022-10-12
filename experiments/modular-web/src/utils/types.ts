export type Fn = (...args: any[]) => any;

export type UnPromise<T> = T extends Promise<any> ? T : Promise<T>;
