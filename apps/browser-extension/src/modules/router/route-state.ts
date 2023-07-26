export interface RouteState {
  path?: string;
  draft?: boolean;
  title?: string;
  command?: string;
  linkTo?: string;
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
