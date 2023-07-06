import { assertDefined } from "../../live-test";
import SCHEMA from "../schema.sql";
import { createTestDb, fsm } from "./fixture";

export async function testFileV2Db() {
  const db = await createTestDb(SCHEMA);
  assertDefined(db, "db is defined");
}

export async function testFileV2StatusUntracked() {
  const db = await createTestDb(SCHEMA);

  fsm(db, ".. .. .. | .. .. .. | .. .. .."); // static
  fsm(db, ".. .. .. | .. .. 1. | .. .. .."); // collapse
  fsm(db, ".. .. .. | .. .. 1a | .. .. 1a");
  fsm(db, ".. .. .. | .. 1. .. | .. .. .."); // auto merge
  fsm(db, ".. .. .. | .. 1a .. | .. 1a ..");
  fsm(db, ".. .. .. | 1. .. .. | .. .. ..");
  fsm(db, ".. .. .. | 1a .. .. | 1a .. ..");
}

export async function testFileV2StatusSynced() {
  const db = await createTestDb(SCHEMA);

  fsm(db, ".. .. 1. | .. .. .. | .. .. .."); // static + collapse
  fsm(db, ".. .. 1a | .. .. .. | .. .. 1a"); // static
  fsm(db, ".. .. 1a | .. .. 2. | .. .. ..");
  fsm(db, ".. .. 1a | .. .. 2a | .. .. 2a");
  fsm(db, ".. .. 1a | .. .. 2b | .. .. 2b");
  fsm(db, ".. .. 1a | .. 2. .. | .. 2. 1a");
  fsm(db, ".. .. 1a | .. 2a .. | .. .. 2a"); // auto merge
  fsm(db, ".. .. 1a | .. 2b .. | .. 2b 1a");
  fsm(db, ".. .. 1a | 2. .. .. | 2. .. 1a");
  fsm(db, ".. .. 1a | 2a .. .. | .. .. 1a"); // noop
  fsm(db, ".. .. 1a | 2b .. .. | 2b .. 1a");

  // reverse
  fsm(db, ".. .. 2a | .. .. 1. | .. .. ..");
  fsm(db, ".. .. 2a | .. .. 1a | .. .. 1a");
  fsm(db, ".. .. 2a | .. .. 1b | .. .. 1b");
  fsm(db, ".. .. 2a | .. 1. .. | .. .. 2a");
  fsm(db, ".. .. 2a | .. 1a .. | .. .. 2a");
  fsm(db, ".. .. 2a | .. 1b .. | .. .. 2a");
}

export async function testFileV2StatusBehind() {
  const db = await createTestDb(SCHEMA);

  fsm(db, ".. 1. .. | .. .. .. | .. .. .."); // static + auto merge
  fsm(db, ".. 1a .. | .. .. .. | .. 1a .."); // static
  fsm(db, ".. 1a .. | .. .. 2. | .. .. .."); // auto merge + collapse
  fsm(db, ".. 1a .. | .. .. 2a | .. .. 2a"); // auto merge
  fsm(db, ".. 1a .. | .. .. 2b | .. .. 2b"); // auto merge
  fsm(db, ".. 1a .. | .. 2. .. | .. .. .."); // auto merge + collapse
  fsm(db, ".. 1a .. | .. 2a .. | .. 2a .."); // auto merge
  fsm(db, ".. 1a .. | .. 2b .. | .. 2b .."); // auto merge
  fsm(db, ".. 1a .. | 2. .. .. | 2. 1a ..");
  fsm(db, ".. 1a .. | 2a .. .. | .. 1a .."); // auto merge
  fsm(db, ".. 1a .. | 2b .. .. | 2b 1a ..");
  fsm(db, ".. 2. 1. | .. .. .. | .. .. .."); // static + auto merge + collapse
  fsm(db, ".. 2. 1a | .. .. .. | .. 2. 1a"); // static
  fsm(db, ".. 2. 1a | .. .. 3. | .. .. .."); // auto merge + collapse
  fsm(db, ".. 2. 1a | .. .. 3a | .. .. 3a"); // auto merge
  fsm(db, ".. 2. 1a | .. .. 3b | .. .. 3b"); // auto merge
  fsm(db, ".. 2. 1a | .. 3. .. | .. 3. 1a");
  fsm(db, ".. 2. 1a | .. 3a .. | .. .. 3a"); // auto merge
  fsm(db, ".. 2. 1a | .. 3b .. | .. 3b 1a");
  fsm(db, ".. 2. 1a | 3. .. .. | .. 2. 1a");
  fsm(db, ".. 2. 1a | 3a .. .. | 3a 2. 1a");
  fsm(db, ".. 2. 1a | 3b .. .. | 3b 2. 1a");
  fsm(db, ".. 2a 1. | .. .. .. | .. 2a .."); // static + collapse
  fsm(db, ".. 2a 1a | .. .. .. | .. .. 2a"); // static + auto merge
  fsm(db, ".. 2b 1a | .. .. .. | .. 2b 1a"); // static
  fsm(db, ".. 2b 1a | .. .. 3. | .. .. .."); // auto merge + collapse
  fsm(db, ".. 2b 1a | .. .. 3a | .. .. 3a"); // auto merge
  fsm(db, ".. 2b 1a | .. .. 3b | .. .. 3b"); // auto merge
  fsm(db, ".. 2b 1a | .. 3. .. | .. 3. 1a");
  fsm(db, ".. 2b 1a | .. 3a .. | .. .. 3a"); // auto merge
  fsm(db, ".. 2b 1a | .. 3b .. | .. 3b 1a");
  fsm(db, ".. 2b 1a | 3. .. .. | 3. 2b 1a");
  fsm(db, ".. 2b 1a | 3a .. .. | 3a 2b 1a"); // no merge due to conflict
  fsm(db, ".. 2b 1a | 3b .. .. | .. 2b 1a"); // auto merge

  // reverse
  fsm(db, ".. 2a .. | .. .. 1. | .. 2a .."); // collapse
  fsm(db, ".. 2a .. | .. .. 1a | .. .. 2a"); // auto merge
  fsm(db, ".. 2a .. | .. .. 1b | .. 2a 1b");
  fsm(db, ".. 2a .. | .. 1. .. | .. .. .."); // collapse
  fsm(db, ".. 2a .. | .. 1a .. | .. 1a ..");
  fsm(db, ".. 2a .. | .. 1b .. | .. 1b ..");
  fsm(db, ".. 2a .. | 1. .. .. | .. 2a .."); // collapse
  fsm(db, ".. 2a .. | 1a .. .. | .. 2a .."); // auto merge
  fsm(db, ".. 2a .. | 1b .. .. | 1b 2a ..");
  fsm(db, ".. 3. 1a | .. .. 2. | .. .. .."); // collapse
  fsm(db, ".. 3. 1a | .. .. 2a | .. 3. 2a");
  fsm(db, ".. 3. 1a | .. .. 2b | .. 3. 2b");
  fsm(db, ".. 3. 1a | .. 2. .. | .. 2. 1a");
  fsm(db, ".. 3. 1a | .. 2a .. | .. .. 2a"); // auto merge
  fsm(db, ".. 3. 1a | .. 2b .. | .. 2b 1a");
  fsm(db, ".. 3. 1a | 2. .. .. | .. 3. 1a"); // collapse
  fsm(db, ".. 3. 1a | 2a .. .. | .. 3. 1a"); // auto merge
  fsm(db, ".. 3. 1a | 2b .. .. | 2b 3. 1a");
  fsm(db, ".. 3b 1a | .. .. 2. | .. 3b .."); // collapse
  fsm(db, ".. 3b 1a | .. .. 2a | .. 3b 2a");
  fsm(db, ".. 3b 1a | .. .. 2b | .. .. 3b"); // auto merge
  fsm(db, ".. 3b 1a | .. .. 2c | .. 3b 2c");
  fsm(db, ".. 3b 1a | .. 2. .. | .. 2. 1a");
  fsm(db, ".. 3b 1a | .. 2a .. | .. .. 2a"); // auto merge
  fsm(db, ".. 3b 1a | .. 2b .. | .. 2b 1a"); // auto merge
  fsm(db, ".. 3b 1a | .. 2c .. | .. 2c 1a");
  fsm(db, ".. 3b 1a | 2. .. .. | 2. 3b 1a");
  fsm(db, ".. 3b 1a | 2a .. .. | .. 3b 1a"); // auto merge
  fsm(db, ".. 3b 1a | 2b .. .. | .. 3b 1a"); // auto merge
  fsm(db, ".. 3b 1a | 2c .. .. | 2c 3b 1a");
}

export async function testFileV2StatusAhead() {
  const db = await createTestDb(SCHEMA);

  fsm(db, "1. .. .. | .. .. .. | .. .. .."); // static + collapse
  fsm(db, "1a .. .. | .. .. .. | 1a .. .."); // static
  fsm(db, "1a .. .. | .. .. 2. | .. .. .."); // auto merge + collapse
  fsm(db, "1a .. .. | .. .. 2a | .. .. 2a"); // auto merge
  fsm(db, "1a .. .. | .. .. 2b | .. .. 2b"); // auto merge
  fsm(db, "1a .. .. | .. 2. .. | 1a 2. .."); // no merge due to conflict
  fsm(db, "1a .. .. | .. 2a .. | .. 2a .."); // auto merge
  fsm(db, "1a .. .. | .. 2b .. | 1a 2b ..");
  fsm(db, "1a .. .. | 2. .. .. | .. .. .."); // collapse
  fsm(db, "1a .. .. | 2a .. .. | 2a .. ..");
  fsm(db, "1a .. .. | 2b .. .. | 2b .. ..");
  fsm(db, "2. .. 1. | .. .. .. | .. .. .."); // static + auto merge + collapse
  fsm(db, "2. .. 1a | .. .. .. | 2. .. 1a"); // static
  fsm(db, "2. .. 1a | .. .. 3. | .. .. .."); // auto merge + collapse
  fsm(db, "2. .. 1a | .. .. 3a | .. .. 3a"); // auto merge
  fsm(db, "2. .. 1a | .. .. 3b | .. .. 3b"); // auto merge
  fsm(db, "2. .. 1a | .. 3. .. | .. 3. 1a"); // auto merge
  fsm(db, "2. .. 1a | .. 3a .. | 2. 3a 1a"); // no merge due to conflict
  fsm(db, "2. .. 1a | .. 3b .. | 2. 3b 1a");
  fsm(db, "2. .. 1a | 3. .. .. | 3. .. 1a");
  fsm(db, "2. .. 1a | 3a .. .. | .. .. 1a");
  fsm(db, "2. .. 1a | 3b .. .. | 3b .. 1a");
  fsm(db, "2a .. 1. | .. .. .. | 2a .. .."); // static + collapse
  fsm(db, "2a .. 1a | .. .. .. | .. .. 1a"); // static + auto merge
  fsm(db, "2b .. 1a | .. .. .. | 2b .. 1a"); // static
  fsm(db, "2b .. 1a | .. .. 3. | .. .. .."); // auto merge + collapse
  fsm(db, "2b .. 1a | .. .. 3a | .. .. 3a"); // auto merge
  fsm(db, "2b .. 1a | .. .. 3b | .. .. 3b"); // auto merge
  fsm(db, "2b .. 1a | .. 3. .. | 2b 3. 1a");
  fsm(db, "2b .. 1a | .. 3a .. | 2b 3a 1a"); // no merge due to conflict
  fsm(db, "2b .. 1a | .. 3b .. | .. 3b 1a"); // auto merge
  fsm(db, "2b .. 1a | 3. .. .. | 3. .. 1a");
  fsm(db, "2b .. 1a | 3a .. .. | .. .. 1a"); // auto merge
  fsm(db, "2b .. 1a | 3b .. .. | 3b .. 1a"); // auto merge

  // reverse
  fsm(db, "2a .. .. | .. .. 1. | 2a .. .."); // collapse
  fsm(db, "2a .. .. | .. .. 1a | .. .. 1a"); // auto merge
  fsm(db, "2a .. .. | .. .. 1b | 2a .. 1b");
  fsm(db, "2a .. .. | .. 1. .. | 2a 1. .."); // no merge due to conflict
  fsm(db, "2a .. .. | .. 1a .. | .. 1a .."); // auto merge
  fsm(db, "2a .. .. | .. 1b .. | 2a 1b ..");
  fsm(db, "2a .. .. | 1. .. .. | .. .. .."); // collapse
  fsm(db, "2a .. .. | 1a .. .. | 1a .. ..");
  fsm(db, "2a .. .. | 1b .. .. | 1b .. ..");
  fsm(db, "3. .. 1a | .. .. 2. | .. .. .."); // collapse
  fsm(db, "3. .. 1a | .. .. 2a | 3. .. 2a");
  fsm(db, "3. .. 1a | .. .. 2b | 3. .. 2b");
  fsm(db, "3. .. 1a | .. 2. .. | .. 2. 1a"); // auto merge
  fsm(db, "3. .. 1a | .. 2a .. | 3. .. 2a"); // auto merge
  fsm(db, "3. .. 1a | .. 2b .. | 3. 2b 1a");
  fsm(db, "3. .. 1a | 2. .. .. | 2. .. 1a");
  fsm(db, "3. .. 1a | 2a .. .. | .. .. 1a"); // auto merge
  fsm(db, "3. .. 1a | 2b .. .. | 2b .. 1a");
  fsm(db, "3b .. 1a | .. .. 2. | 3b .. .."); // collapse
  fsm(db, "3b .. 1a | .. .. 2a | 3b .. 2a"); // auto merge
  fsm(db, "3b .. 1a | .. .. 2b | .. .. 2b"); // auto merge
  fsm(db, "3b .. 1a | .. .. 2c | 3b .. 2c");
  fsm(db, "3b .. 1a | .. 2. .. | 3b 2. 1a");
  fsm(db, "3b .. 1a | .. 2a .. | 3b .. 2a"); // auto merge
  fsm(db, "3b .. 1a | .. 2b .. | .. 2b 1a"); // auto merge
  fsm(db, "3b .. 1a | .. 2c .. | 3b 2c 1a");
  fsm(db, "3b .. 1a | 2. .. .. | 2. .. 1a");
  fsm(db, "3b .. 1a | 2a .. .. | .. .. 1a"); // auto merge
  fsm(db, "3b .. 1a | 2b .. .. | 2b .. 1a");
  fsm(db, "3b .. 1a | 2c .. .. | 2c .. 1a");
}

export async function testFileV2StatusConflict() {
  const db = await createTestDb(SCHEMA);

  fsm(db, "1. 2. .. | .. .. .. | .. .. .."); // static + collapse
  fsm(db, "1. 2. 3. | .. .. .. | .. .. .."); // static + collapse
  fsm(db, "1. 2. 3a | .. .. .. | .. .. 3a"); // static + collapse
  fsm(db, "1. 2a .. | .. .. .. | .. 2a .."); // static + collapse
  fsm(db, "1. 2a. 3. | .. .. .. | .. .. .."); // static + collapse + auto merge
  fsm(db, "1. 2a. 3a | .. .. .. | .. .. 3a"); // static + collapse + auto merge
  fsm(db, "1. 2a. 3b | .. .. .. | .. .. 3b"); // static + collapse + auto merge
  fsm(db, "1a 2. .. | .. .. .. | 1a 2. .."); // static + no merge due to conflict
  fsm(db, "1a 2. 3. | .. .. .. | .. .. .."); // static + collapse + auto merge
  fsm(db, "1a 2. 3a | .. .. .. | .. .. 3a"); // static + collapse + auto merge
  fsm(db, "1a 2. 3b | .. .. .. | .. .. 3b"); // static + collapse + auto merge
  fsm(db, "1a 2a .. | .. .. .. | .. 2a .."); // static + collapse
  fsm(db, "1a 2a 3. | .. .. .. | .. .. .."); // static + collapse + auto merge
  fsm(db, "1a 2a 3a | .. .. .. | .. .. 3a"); // static + auto merge
  fsm(db, "1a 2a 3b | .. .. .. | .. .. 3b"); // static + auto merge
  fsm(db, "1a 2b .. | .. .. .. | 1a 2b .."); // static
  fsm(db, "1a 2b 3. | .. .. .. | .. .. .."); // static + collapse + auto merge
  fsm(db, "1a 2b 3a | .. .. .. | .. .. 3a"); // static + auto merge
  fsm(db, "1a 2b 3b | .. .. .. | .. .. 3b"); // static + auto merge
  fsm(db, "1a 2b 3c | .. .. .. | .. .. 3c"); // static + auto merge
  fsm(db, "2. 1. .. | .. .. .. | .. .. .."); // static + collapse
  fsm(db, "2. 1. 3. | .. .. .. | .. .. ..");
  fsm(db, "2. 1. 3a | .. .. .. | .. .. 3a");
  fsm(db, "2. 1a .. | .. .. .. | 2. 1a .."); // static
  fsm(db, "2. 1a 3. | .. .. .. | .. .. ..");
  fsm(db, "2. 1a 3a | .. .. .. | .. .. 3a");
  fsm(db, "2. 1a 3b | .. .. .. | .. .. 3b");
  fsm(db, "2. 3. 1. | .. .. .. | .. .. .."); // static + collapse
  fsm(db, "2. 3. 1a | .. .. .. | .. 3. 1a"); // static + auto merge
  fsm(db, "2. 3a 1. | .. .. .. | .. 3a .."); // static + collapse
  fsm(db, "2. 3a 1a | .. .. .. | 2. 3a 1a"); // static + no merge due to conflict
  fsm(db, "2. 3b 1a | .. .. .. | 2. 3b 1a"); // static
  fsm(db, "2. 3b 1c | .. .. .. | 2. 3b 1c"); // static
  fsm(db, "2a 1. .. | .. .. .. | 2a 1. .."); // no merge due to conflict
  fsm(db, "2a 1. 3. | .. .. .. | .. .. ..");
  fsm(db, "2a 1. 3a | .. .. .. | .. .. 3a");
  fsm(db, "2a 1. 3b | .. .. .. | .. .. 3b");
  fsm(db, "2a 1a .. | .. .. .. | .. 1a .."); // static + auto merge
  fsm(db, "2a 1a 3. | .. .. .. | .. .. ..");
  fsm(db, "2a 1a 3a | .. .. .. | .. .. 3a");
  fsm(db, "2a 1a 3b | .. .. .. | .. ..  3b");
  fsm(db, "2a 1b .. | .. .. .. | 2a 1b .."); // static
  fsm(db, "2a 1b 3. | .. .. .. | .. .. ..");
  fsm(db, "2a 1b 3a | .. .. .. | .. .. 3a");
  fsm(db, "2a 1b 3b | .. .. .. | .. .. 3b");
  fsm(db, "2a 1b 3c | .. .. .. | .. .. 3c");
  fsm(db, "2a 3. 1. | .. .. .. | 2a 3. .."); // static + collapse
  fsm(db, "2a 3. 1a | .. .. .. | .. 3. 1a"); // static + auto merge
  fsm(db, "2a 3a 1. | .. .. .. | .. 3a .."); // static + auto merge
  fsm(db, "2a 3a 1a | .. .. .. | .. .. 3a"); // static + auto merge
  fsm(db, "2a 3b 1. | .. .. .. | 2a 3b .."); // static + collapse
  fsm(db, "2a 3b 1a | .. .. .. | .. 3b 1a"); // static + auto merge
  fsm(db, "2b 3. 1a | .. .. .. | 2b 3. 1a"); // static
  fsm(db, "2b 3b 1a | .. .. .. | .. 3b 1a"); // static + auto merge
  fsm(db, "2b 3c 1a | .. .. .. | 2b 3c 1a"); // static
  fsm(db, "2c 3b 1a | .. .. .. | 2c 3b 1a"); // static

  fsm(db, "3. 2. 1. | .. .. .. | .. .. .."); // static + collapse
  fsm(db, "3. 2. 1a | .. .. .. | .. 2. 1a"); // static + auto merge
  fsm(db, "3. 2a 1. | .. .. .. | 3. 2a .."); // static + collapse
  fsm(db, "3. 2a 1a | .. .. .. | 3. .. 2a"); // static + auto merge
  fsm(db, "3. 2b 1a | .. .. .. | 3. 2b 1a"); // static
  fsm(db, "3a 2. 1. | .. .. .. | 3a .. .."); // static + collapse
  fsm(db, "3a 2. 1a | .. .. .. | 3a 2. 1a"); // static + no merge due to conflict
  fsm(db, "3a 2a 1. | .. .. .. | .. 2a .."); // static + auto merge
  fsm(db, "3a 2a 1a | .. .. .. | .. .. 2a"); // static + auto merge
  fsm(db, "3a 2b 1a | .. .. .. | 3a 2b 1a"); // static + no merge due to conflict
  fsm(db, "3b 2. 1a | .. .. .. | 3b 2. 1a"); // static
  fsm(db, "3b 2a 1. | .. .. .. | 3b 2a .."); // static + collapse
  fsm(db, "3b 2a 1a | .. .. .. | 3b .. 2a"); // static + auto merge
  fsm(db, "3b 2b 1a | .. .. .. | .. 2b 1a"); // static + auto merge
  fsm(db, "3c 2b 1a | .. .. .. | 3c 2b 1a"); // static
}

let vocab = ["..", "1.", "1a", "1b", "1c", "2.", "2a", "2b", "2c", "3.", "3a", "3b", "3c"];

let allOptions = [];
for (let i = 0; i < vocab.length; i++) {
  for (let j = 0; j < vocab.length; j++) {
    for (let k = 0; k < vocab.length; k++) {
      allOptions.push([vocab[i], vocab[j], vocab[k]]);
    }
  }
}

let qualifiedOptions = allOptions.filter(([a, b, c]) => {
  // all unique
  if (a === b || a === c || b === c) return false;

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

console.log(qualifiedOptions.length);
console.log(qualifiedOptions.map((x) => x.join(" ")));
