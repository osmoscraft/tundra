import { encodeParsedState, parseState, type ParsedState } from "./fixture";

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

console.log(qualifiedOptions.length); // 114 test cases
console.log(qualifiedOptions);

const testInOut = qualifiedOptions.map((inArr) => {
  const initial = inArr.join(" ");
  let prev = "";
  let current = initial;

  let pass = 0;
  while (current !== prev) {
    pass++;
    prev = current;
    current = digestMultiPass(prev);
  }

  const passCount = pass - 1;

  const multiPassResult = `${initial} | ${current}`;
  const singlePassResult = `${initial} | ${digestStateSinglePass(initial)}`;
  const singlePassResultUnordered = `${initial} | ${digestStateSinglePassUnordered(initial)}`;

  if (multiPassResult !== singlePassResult) {
    throw new Error(`Multi-pass and single-pass results do not match:
Multi: ${multiPassResult}
Single: ${singlePassResult}`);
  }

  if (singlePassResult !== singlePassResultUnordered) {
    throw new Error(`Single-pass and single-pass-unordered results do not match:
Single: ${singlePassResult}
Single Unordered: ${singlePassResultUnordered}`);
  }

  return `${multiPassResult} (${passCount} pass)`;
});

function digestMultiPass(stateSpec: string): string {
  const parsed = parseState(stateSpec);
  // sort events by time ascending
  const sortedEvent = [
    parsed?.local ? { origin: "local", ...parsed?.local } : null,
    parsed?.remote ? { origin: "remote", ...parsed?.remote } : null,
    parsed?.synced ? { origin: "synced", ...parsed?.synced } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a!.updatedAt - b!.updatedAt);

  // digest events
  const initialState: ParsedState = {
    type: "STATE",
    local: null,
    remote: null,
    synced: null,
  };

  const finalState = sortedEvent.reduce((acc, event) => {
    switch (event?.origin) {
      case "local":
        acc.local = event;
        // merge if no conflict
        if (
          (!acc.remote || acc.local.updatedAt === acc.remote.updatedAt) && // no conflict with remote (tie breaker to ensure local<->remote symmetry)
          acc.local.content === (acc.synced?.content ?? null) // mergeable with synced
        ) {
          acc.local = null;
        }

        // discard if repeating remote
        if (acc.remote?.content === acc.local?.content) {
          acc.local = null;
        }

        break;
      case "remote":
        acc.remote = event;
        // merge if no conflict
        if (
          (!acc.local || acc.local.updatedAt === acc.remote.updatedAt) && // no conflict with local (tie breaker to ensure local<->remote symmetry)
          acc.remote.content === (acc.synced?.content ?? null) // mergeable with synced
        ) {
          acc.synced = acc.remote;
          acc.remote = null;
        }

        // absort local if repeating local
        if (acc.remote?.content === acc.local?.content) {
          acc.local = null;
        }

        break;
      case "synced":
        acc.synced = event;
        // clear outdated local and remote
        if (event.updatedAt >= Math.max(acc.local?.updatedAt ?? 0, acc.remote?.updatedAt ?? 0)) {
          acc.local = null;
          acc.remote = null;
        }

        // collapse synced when it is null
        if (acc.synced?.content === null) {
          acc.synced = null;
        }
        break;
    }

    return acc;
  }, initialState);

  return encodeParsedState(finalState);
}

function digestStateSinglePass(stateSpec: string): string {
  const parsed = parseState(stateSpec);
  // sort events by time ascending
  const sortedEvent = [
    parsed?.local ? { origin: "local", ...parsed?.local } : null,
    parsed?.remote ? { origin: "remote", ...parsed?.remote } : null,
    parsed?.synced ? { origin: "synced", ...parsed?.synced } : null,
  ]
    .filter(Boolean)
    .sort((a, b) => a!.updatedAt - b!.updatedAt);

  // digest events
  const initialState: ParsedState = {
    type: "STATE",
    local: null,
    remote: null,
    synced: null,
  };

  const finalState = sortedEvent.reduce((acc, event) => {
    switch (event?.origin) {
      case "local":
        acc.local = event;
        // merge if no conflict
        if (
          (!acc.remote || acc.local.updatedAt === acc.remote.updatedAt) && // no conflict with remote (tie breaker to ensure local<->remote symmetry)
          acc.local.content === (acc.synced?.content ?? null) // mergeable with synced
        ) {
          acc.local = null;
        }

        // discard if repeating remote
        if (acc.remote?.content === acc.local?.content) {
          acc.local = null;
        }

        break;
      case "remote":
        acc.remote = event;
        // merge if no conflict
        if (
          (!acc.local || acc.local.updatedAt === acc.remote.updatedAt) && // no conflict with local (tie breaker to ensure local<->remote symmetry)
          acc.remote.content === (acc.synced?.content ?? null) // mergeable with synced
        ) {
          // Because we generated a synced event, it would require an additional pass
          // To prevent the pass, we also process the rules for synced event here
          acc.synced = acc.remote;
          acc.remote = null;

          // clear outdated local
          if (acc.synced.updatedAt >= (acc.local?.updatedAt ?? 0)) {
            acc.local = null;
          }

          // collapse synced when it is null
          if (acc.synced?.content === null) {
            acc.synced = null;
          }
        }

        // absort local if repeating local
        if (acc.remote?.content === acc.local?.content) {
          acc.local = null;
        }

        break;
      case "synced":
        acc.synced = event;
        // clear outdated local and remote
        if (event.updatedAt >= Math.max(acc.local?.updatedAt ?? 0, acc.remote?.updatedAt ?? 0)) {
          acc.local = null;
          acc.remote = null;
        }

        // collapse synced when it is null
        if (acc.synced?.content === null) {
          acc.synced = null;
        }
        break;
    }

    return acc;
  }, initialState);

  return encodeParsedState(finalState);
}

/**
 * The reducer in this algorithm is meant to be ported into SQLite trigger
 */
function digestStateSinglePassUnordered(stateSpec: string): string {
  const parsed = parseState(stateSpec);
  // sort events by time ascending
  const sortedEvent = [
    parsed?.synced ? { origin: "synced", ...parsed?.synced } : null,
    parsed?.local ? { origin: "local", ...parsed?.local } : null,
    parsed?.remote ? { origin: "remote", ...parsed?.remote } : null,
  ].filter(Boolean);

  // digest events
  const acc: ParsedState = {
    type: "STATE",
    local: sortedEvent.find((e) => e?.origin === "local") ?? null,
    remote: sortedEvent.find((e) => e?.origin === "remote") ?? null,
    synced: sortedEvent.find((e) => e?.origin === "synced") ?? null,
  };

  // clear outdated local and remote
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

console.log(testInOut.join("\n"));
console.log(testInOut.length);
