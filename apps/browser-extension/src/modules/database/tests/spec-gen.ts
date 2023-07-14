import { DbFileCompareStatus } from "../schema";
import { encodeParsedState, parseState, type ParsedState } from "./fixture";

export function generateFsmDeterminismSpecs(): { input: string; output: string }[] {
  const specs = getQualifiedInputs().map((initial) => {
    const output = digestStateSinglePassUnordered(initial);
    return { input: initial, output: output };
  });

  return specs;
}

export function generateFsmSinkSpecs(): { input: string; output: string }[] {
  const specs = generateFsmDeterminismSpecs();
  const uniqueSpecOutputs = specs.map((spec) => spec.output).filter((x, i, a) => a.indexOf(x) === i);
  return uniqueSpecOutputs.map((spec) => ({ input: spec, output: spec }));
}

export function generateFsmDerivedColumnSpecs(): { input: string; cols: { key: string; value: any }[] }[] {
  const sinkSpecs = generateFsmSinkSpecs();
  const parsedSinkSpecs = sinkSpecs
    .map((spec) => ({ raw: spec.output, parsed: parseState(spec.output)! }))
    .filter((spec) => spec.parsed !== null); // do not test blank rows

  const specs = parsedSinkSpecs.map((spec) => {
    // rules for derived columns:
    // localStatus:
    // - added: local content not null, synced null
    // - removed: local content null, synced not null
    // - modified: local and synced not null
    // - unchanged: otherwise

    let localStatus = DbFileCompareStatus.Unchanged;

    switch (true) {
      case spec.parsed.local && spec.parsed.local.content !== null && spec.parsed.synced === null: {
        localStatus = DbFileCompareStatus.Added;
        break;
      }
      case spec.parsed.local &&
        spec.parsed.local.content === null &&
        spec.parsed.synced &&
        spec.parsed.synced.content !== null: {
        localStatus = DbFileCompareStatus.Removed;
        break;
      }
      case spec.parsed.local &&
        spec.parsed.local.content !== null &&
        spec.parsed.synced &&
        spec.parsed.synced?.content !== null: {
        localStatus = DbFileCompareStatus.Modified;
        break;
      }
    }

    return {
      input: spec.raw,
      cols: [{ key: "localStatus", value: localStatus }],
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
