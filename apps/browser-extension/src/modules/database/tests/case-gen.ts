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
  if (new Set(digits).size !== digits.length) return false;

  // 2x requires seeing 1x
  if (digits.includes("2") && !digits.includes("1")) return false;

  // 3x requires seeing 2x
  if (digits.includes("3") && !digits.includes("2")) return false;

  // xc requires seeing xb
  if (letters.includes("c") && !letters.includes("b")) return false;

  // xb requires seeing xa
  if (letters.includes("b") && !letters.includes("a")) return false;

  // abc must appear in ascending order from left to right
  if (
    letters
      .filter((x) => x !== ".")
      .sort()
      .join("") !== letters.filter((x) => x !== ".").join("")
  )
    return false;

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
    current = digestState(prev);
  }

  return `${initial} | ${current} (pass ${pass - 1})`;
});

function digestState(stateSpec: string): string {
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
        if (!acc.remote && acc.local.content === (acc.synced?.content ?? null)) {
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
        if (!acc.local && acc.remote.content === (acc.synced?.content ?? null)) {
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
        if (event.updatedAt > Math.max(acc.local?.updatedAt ?? 0, acc.remote?.updatedAt ?? 0)) {
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

console.log(testInOut.join("\n"));
