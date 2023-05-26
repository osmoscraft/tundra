export function assertEqual(expected?: any, actual?: any, message?: string) {
  if (expected !== actual) {
    throw new Error(`Assert equal filed: ${message ?? ""}\nExpeced: ${expected}\nActual: ${actual}`);
  }
}

export function assertDeepEqual(expected?: any, actual?: any, message?: string) {
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(`Assert deep equal filed: ${message ?? ""}\nExpeced: ${expected}\nActual: ${actual}`);
  }
}

export function assertDefined(actual: any, message: string) {
  if (typeof actual === "undefined") {
    throw new Error(`Assert defined failed: ${message}`);
  }
}
