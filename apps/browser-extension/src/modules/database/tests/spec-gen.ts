import { encodeParsedState, parseState, type ParsedState } from "./fixture";

export function generateFsmSpecs(): { input: string; output: string }[] {
  const testInOut = getQualifiedInputs().map((initial) => {
    const output = digestStateSinglePassUnordered(initial);
    return { input: initial, output: output };
  });

  return testInOut;
}

export function getQualifiedInputs(): string[] {
  const vocab = ["..", "1.", "1a", "1b", "1c", "2.", "2a", "2b", "2c", "3.", "3a", "3b", "3c"];

  const allOptions = [];
  for (let i = 0; i < vocab.length; i++) {
    for (let j = 0; j < vocab.length; j++) {
      for (let k = 0; k < vocab.length; k++) {
        allOptions.push([vocab[i], vocab[j], vocab[k]]);
      }
    }
  }

  const qualifiedOptions = allOptions.filter(([a, b, c]) => {
    // all digit unique
    const withDigit = [a, b, c].filter((x) => x !== "..");
    const digits = withDigit.map((x) => x[0]);
    const letters = withDigit.map((x) => x[1]);

    // unique timestamps
    // if (new Set(digits).size !== digits.length) return false;

    // 2x requires seeing 1x
    if (digits.includes("2") && !digits.includes("1")) return false;

    // 3x requires seeing 2x
    if (digits.includes("3") && !digits.includes("2")) return false;

    // xc requires seeing xb
    if (letters.includes("c") && !letters.includes("b")) return false;

    // xb requires seeing xa
    if (letters.includes("b") && !letters.includes("a")) return false;

    // first index of a,b,c must appear in ascending order from left to right
    const firstIndex = ["a", "b", "c"].map((x) => letters.indexOf(x));
    if (firstIndex.sort().join("") !== firstIndex.join("")) return false;

    return true;
  });

  return qualifiedOptions.map((item) => item.join(" "));
}

const sql = {
  eq: (a: any, b: any) => (a === null || a === undefined || b === null || b === undefined ? null : a === b),
  is: (a: any, b: any) => (a ?? null) === (b ?? null),
  gt: (a: any, b: any) => a !== undefined && b !== undefined && a > b,
  gte: (a: any, b: any) => a !== undefined && b !== undefined && a >= b,
  lte: (a: any, b: any) => a !== undefined && b !== undefined && a <= b,
  not: (a: any) => (a === undefined || a === null ? null : !a),
  isnull: (a: any) => a === undefined || a === null,
  isnotnull: (a: any) => a !== undefined && a !== null,
  "->": (a: any, b: any) =>
    a === undefined || a === null
      ? null
      : Object.hasOwn(a, b.replace("$.", ""))
      ? JSON.stringify(a[b.replace("$.", "")])
      : null,
};

/**
 * The reducer in this algorithm is meant to be ported into SQLite trigger
 */
export function digestStateSinglePassUnordered(stateSpec: string): string {
  const parsed = parseState(stateSpec);
  // digest events
  const acc: ParsedState = {
    type: "STATE",
    local: parsed?.local ?? null,
    remote: parsed?.remote ?? null,
    synced: parsed?.synced ?? null,
  };

  // clear outdated local and remote
  if (sql.gte(acc.synced?.updatedAt, acc.local?.updatedAt)) {
    acc.local = null;
  }
  if (sql.gte(acc.synced?.updatedAt, acc.remote?.updatedAt)) {
    acc.remote = null;
  }

  // auto merge local
  const mergableWithSynced =
    (sql.isnull(acc.remote) || sql.lte(acc.local?.updatedAt, acc.remote!.updatedAt)) &&
    sql.is(acc.local?.content, acc.synced?.content);

  // both has content ='null' or both has same content
  const mergableWithRemote = sql.eq(sql["->"](acc.local, "$.content"), sql["->"](acc.remote, "$.content"));

  if (mergableWithSynced || mergableWithRemote) {
    acc.local = null;
  }

  // auto merge remote
  if (
    (sql.isnull(acc.local) || sql.lte(acc.remote?.updatedAt, acc.local!.updatedAt)) && // no conflict with local
    sql.is(acc.remote?.content, acc.synced?.content) // mergeable with synced
  ) {
    acc.synced = acc.remote;
    acc.remote = null;
  }

  // Because we recreated a synced event
  // we need to process the rules for synced event here
  // clear outdated local again!
  if (sql.gte(acc.synced?.updatedAt, acc.local?.updatedAt)) {
    acc.local = null;
  }

  // collapse synced when it is null
  if (sql.eq(sql["->"](acc.synced, "$.content"), "null")) {
    acc.synced = null;
  }

  return encodeParsedState(acc);
}
