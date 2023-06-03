export function assertEqual<T = any>(actual?: T, expected?: T, message?: string) {
  if (expected !== actual) {
    throw new Error(`Assert equal filed: ${message ?? ""}\nExpeced: ${expected}\nActual: ${actual}`);
  }
}

export function assertDeepEqual<T = any>(actual?: T, expected?: T, message?: string) {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(
      `Assert deep equal filed: ${message ?? ""}\nExpeced: ${JSON.stringify(
        expected,
        null,
        2
      )}\nActual: ${JSON.stringify(actual, null, 2)}`
    );
  }
}

export function assertDefined(actual: any, message: string) {
  if (typeof actual === "undefined") {
    throw new Error(`Assert defined failed: ${message}`);
  }
}

export function assertUndefined(actual: any, message: string) {
  if (typeof actual !== "undefined") {
    throw new Error(`Assert undefined failed: ${message}`);
  }
}
