export interface GraphNodeInput {
  path: string;
  content: string;
  updatedAt?: number;
}
export interface GraphNodeOutput<T = any> extends GraphNodeInput {
  meta: T;
}

export function commit(nodes: GraphNodeInput[]) {}
export function clone(nodes: GraphNodeInput[]) {}
export function pull(nodes: GraphNodeInput[]) {}
export function push(nodes: GraphNodeInput[]) {}
export function get<T = any>(paths: string[]): GraphNodeOutput<T>[] {
  return [];
}
export function search<T = any>(query: string): GraphNodeOutput<T>[] {
  return [];
}
