export function bindParams(sql: string, params: any) {
  const bindKeys = sql.matchAll(/:([a-zA-Z0-9]+)/g);
  const bindObject = Object.fromEntries([...bindKeys].map(([key, variableName]) => [key, params[variableName]]));

  return bindObject;
}

export function arrayToParams(objects: any[]) {
  return Object.fromEntries(
    objects.flatMap((object, i) => Object.entries(object).map(([key, value]) => [`${key}${i}`, value]))
  );
}
