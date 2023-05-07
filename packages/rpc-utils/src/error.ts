export function encodeError(error: any) {
  if (error instanceof Error) {
    return { name: error?.name, message: error?.message, stack: error?.stack, cause: error?.cause };
  } else {
    return error;
  }
}

export function decodeError(encodedError?: any) {
  if (typeof encodedError?.name === "string" && typeof encodedError?.message === "string") {
    const error = new Error(encodedError.message);
    error.name = encodedError.name;
    error.stack = encodedError.stack;
    error.cause = encodedError.cause;

    return error;
  } else {
    return encodedError;
  }
}
