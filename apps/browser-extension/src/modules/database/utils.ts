export function paramsToBindings(sql: string, params: any) {
  const bindKeys = sql.matchAll(/:([a-zA-Z0-9]+)/g);
  const bindObject = Object.fromEntries(
    [...bindKeys].map(([key, variableName]) => [key, getOrThrow(params, variableName)])
  );

  return bindObject;
}

function getOrThrow(object: any, key: string) {
  if (object.hasOwnProperty(key)) {
    return object[key];
  } else {
    console.error(`Variable ":${key}" has no matching key "${key}" in object`, object);
    throw new Error(`Binding key not found`);
  }
}

export function arrayToParams(objects: any[]) {
  return Object.fromEntries(
    objects.flatMap((object, i) => Object.entries(object).map(([key, value]) => [`${key}${i}`, value]))
  );
}
