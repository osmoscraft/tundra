import { DbFileAction, type DbInternalFile } from "../schema";
import { encodeParsedState, parseState, type ParsedState } from "./fixture";

export function generateFsmDeterminismSpecs(): { input: string; output: string }[] {
  const specs = getQualifiedInputs().map((initial) => {
    const output = digestStateSinglePassUnordered(initial);
    return { input: initial, output: output };
  });

  return specs;
}

export function generateFsmSinkSpecs(): string[] {
  const specs = generateFsmDeterminismSpecs();
  const uniqueSpecOutputs = specs.map((spec) => spec.output).filter((x, i, a) => a.indexOf(x) === i);
  return uniqueSpecOutputs;
}

export function generateFsmCanonicalSpecs(): string[] {
  const specs = generateFsmDeterminismSpecs();
  const uniqueSpecOutputs = specs.map((spec) => toCanonicalSpec(spec.output)).filter((x, i, a) => a.indexOf(x) === i);
  return uniqueSpecOutputs;
}

export interface ColumnSpec {
  input: string;
  cols: { key: keyof DbInternalFile; value: any }[];
}
export function generateFsmDerivedColumnSpecs(): {
  input: string;
  cols: { key: keyof DbInternalFile; value: any }[];
}[] {
  const canonicalSpecs = generateFsmCanonicalSpecs();
  const parsedSinkSpecs = canonicalSpecs
    .map((spec) => ({ raw: spec, parsed: parseState(spec)! }))
    .filter((spec) => spec.parsed !== null); // do not test blank rows

  const specs = parsedSinkSpecs.map((spec) => {
    // rules for derived columns:
    // localAction:
    // - added: local content not null, synced null
    // - removed: local content null, synced not null
    // - modified: local and synced not null
    // - unchanged: otherwise

    let localAction = DbFileAction.None;

    switch (true) {
      case spec.parsed.local && spec.parsed.local.content !== null && spec.parsed.synced === null: {
        localAction = DbFileAction.Add;
        break;
      }
      case spec.parsed.local &&
        spec.parsed.local.content === null &&
        spec.parsed.synced &&
        spec.parsed.synced.content !== null: {
        localAction = DbFileAction.Remove;
        break;
      }
      case spec.parsed.local &&
        spec.parsed.local.content !== null &&
        spec.parsed.synced &&
        spec.parsed.synced?.content !== null: {
        localAction = DbFileAction.Modify;
        break;
      }
    }

    let remoteAction = DbFileAction.None;

    switch (true) {
      case spec.parsed.remote && spec.parsed.remote.content !== null && spec.parsed.synced === null: {
        remoteAction = DbFileAction.Add;
        break;
      }
      case spec.parsed.remote &&
        spec.parsed.remote.content === null &&
        spec.parsed.synced &&
        spec.parsed.synced.content !== null: {
        remoteAction = DbFileAction.Remove;
        break;
      }
      case spec.parsed.remote &&
        spec.parsed.remote.content !== null &&
        spec.parsed.synced &&
        spec.parsed.synced?.content !== null: {
        remoteAction = DbFileAction.Modify;
        break;
      }
    }

    const cols: ColumnSpec["cols"] = [
      { key: "localAction", value: localAction },
      { key: "remoteAction", value: remoteAction },
    ];

    return {
      input: spec.raw,
      cols,
    };
  });

  return specs;
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

/**
 * This algorithm is meant to be ported into SQLite trigger
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

  if ((acc.synced?.updatedAt ?? 0) >= (acc.local?.updatedAt ?? 0)) {
    acc.local = null;
  }
  if ((acc.synced?.updatedAt ?? 0) >= (acc.remote?.updatedAt ?? 0)) {
    acc.remote = null;
  }

  // auto merge local
  const mergableWithSynced =
    acc.local &&
    (!acc.remote || acc.local.updatedAt <= acc.remote.updatedAt) &&
    acc.local.content === (acc.synced?.content ?? null);

  const mergableWithRemote = acc.remote?.content === acc.local?.content;

  if (mergableWithSynced || mergableWithRemote) {
    acc.local = null;
  }
  // auto merge remote
  if (
    acc.remote &&
    (!acc.local || acc.remote.updatedAt <= acc.local.updatedAt) && // no conflict with local
    acc.remote.content === (acc.synced?.content ?? null) // mergeable with synced
  ) {
    acc.synced = acc.remote;
    acc.remote = null;
  }
  // Because we recreated a synced event
  // we need to process the rules for synced event here
  // clear outdated local again!
  if ((acc.synced?.updatedAt ?? 0) >= (acc.local?.updatedAt ?? 0)) {
    acc.local = null;
  }
  // collapse synced when it is null
  if (acc.synced?.content === null) {
    acc.synced = null;
  }

  return encodeParsedState(acc);
}

function toCanonicalSpec(spec: string): string {
  let timeSpecs = [spec[0], spec[3], spec[6]];
  let contentSpecs = [spec[1], spec[4], spec[7]];

  // pack all timestamps into consecutive numbers
  // ignore . and map index -> 1,2,3...
  // if 2 is missing, 3 -> 2
  if (!timeSpecs.includes("2")) {
    timeSpecs = timeSpecs.map((x) => (x === "3" ? "2" : x));
  }
  // if 1 is missing, 2 -> 1 and 3 -> 2
  if (!timeSpecs.includes("1")) {
    timeSpecs = timeSpecs.map((x) => (x === "2" ? "1" : x)).map((x) => (x === "3" ? "2" : x));
  }

  // pack all file contents into consecutive letters
  // ignore . and map index -> a,b,c...
  // if b is missing, c -> b
  if (!contentSpecs.includes("b")) {
    contentSpecs = contentSpecs.map((x) => (x === "c" ? "b" : x));
  }
  // if a is missing, b -> a and c -> b
  if (!contentSpecs.includes("a")) {
    contentSpecs = contentSpecs.map((x) => (x === "b" ? "a" : x)).map((x) => (x === "c" ? "b" : x));
  }

  // make all letters ascending
  const orderedCharset = [".", "a", "b", "c"];
  const charset = [...new Set(contentSpecs)]; // . | .a | .ab | .abc but in any order
  const charsetIndexToOrderedCarsetMap = charset.map((x) => orderedCharset.indexOf(x));
  contentSpecs = contentSpecs.map((x) => orderedCharset[charsetIndexToOrderedCarsetMap[charset.indexOf(x)]]);

  return `${timeSpecs[0]}${contentSpecs[0]} ${timeSpecs[1]}${contentSpecs[1]} ${timeSpecs[2]}${contentSpecs[2]}`;
}
