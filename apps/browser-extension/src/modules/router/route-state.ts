export interface RouteState {
  id?: string;
  title?: string;
  url?: string;
  command?: string;
  linkToId?: string;
}

export function stateToParams(state: RouteState) {
  return new URLSearchParams(
    Object.entries(state)
      .filter(([_k, v]) => v !== false && v !== undefined)
      .map(([k, v]) => [k, `${v}`])
  );
}

export function updateRouteState(base: RouteState, patch: Partial<RouteState>): RouteState {
  const patched = { ...base, ...patch };
  return patched;
}

export function paramsToRouteState(params: URLSearchParams): RouteState {
  return Object.fromEntries(params);
}
