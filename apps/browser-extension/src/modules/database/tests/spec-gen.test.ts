import assert from "node:assert";
import { describe, it } from "node:test";
import { encodeParsedState, parseState, type ParsedState } from "./fixture";
import { digestStateSinglePassUnordered, getQualifiedInputs } from "./spec-gen";

describe("generateFsmSpecs", () => {
  it("should generate valid spec", () => {
    testSpecGenerator();
  });
});

export function testSpecGenerator() {
  let maxPass = 0;

  const testInOut = getQualifiedInputs().map((initial) => {
    let prev = "";
    let current = initial;

    let pass = 0;
    while (current !== prev) {
      pass++;
      prev = current;
      current = digestMultiPass(prev);
    }

    const passCount = pass - 1;
    maxPass = Math.max(maxPass, passCount);

    const multiPassResult = `${initial} | ${current}`;
    const singlePassResult = `${initial} | ${digestStateSinglePass(initial)}`;
    const singlePassResultUnordered = `${initial} | ${digestStateSinglePassUnordered(initial)}`;

    assert.strictEqual(
      multiPassResult,
      singlePassResult,
      `Multi-pass and single-pass results do not match:
Multi: ${multiPassResult}
Single: ${singlePassResult}`
    );

    assert.strictEqual(
      singlePassResult,
      singlePassResultUnordered,
      `Single-pass and single-pass-unordered results do not match:
Single: ${singlePassResult}
Single Unordered: ${singlePassResultUnordered}`
    );

    // console.log(`${multiPassResult} (${passCount} pass)`);
    return { input: initial, output: multiPassResult };
  });

  assert(maxPass > 1, `Multipass did not take more than one pass`);

  console.log("Total cases", testInOut.length);
  console.log("Max pass", maxPass);

  return testInOut;
}

export function digestMultiPass(stateSpec: string): string {
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

export function digestStateSinglePass(stateSpec: string): string {
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
