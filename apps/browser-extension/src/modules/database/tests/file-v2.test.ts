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
  fsm(db, ".. 1a .. | 2a .. .. | .. 1a .."); // auto resolve
  fsm(db, ".. 1a .. | 2b .. .. | 2b 1a ..");
  fsm(db, ".. 2. 1. | .. .. .. | .. .. .."); // static + auto merge + collapse
  fsm(db, ".. 2a 1. | .. .. .. | .. 2a .."); // static + collapse
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
  fsm(db, ".. 2a 1a | .. .. .. | .. .. 2a"); // static + auto merge

  fsm(db, ".. 2b 1a | .. .. .. | .. 2b 1a"); // static
  fsm(db, ".. 2b 1a | .. .. 3. | .. .. .."); // auto merge + collapse
  fsm(db, ".. 2b 1a | .. .. 3a | .. .. 3a"); // auto merge
  fsm(db, ".. 2b 1a | .. .. 3b | .. .. 3b"); // auto merge
  fsm(db, ".. 2b 1a | .. 3. .. | .. 3. 1a");
  fsm(db, ".. 2b 1a | .. 3a .. | .. .. 3a"); // auto merge
  fsm(db, ".. 2b 1a | .. 3b .. | .. 3b 1a");
  fsm(db, ".. 2b 1a | 3. .. .. | 3. 2b 1a");
  fsm(db, ".. 2b 1a | 3a .. .. | 3a 2b 1a");
  fsm(db, ".. 2b 1a | 3b .. .. | .. 2b 1a"); // auto resolve

  // reverse
  fsm(db, ".. 2a .. | .. .. 1. | .. 2a .."); // collapse
  fsm(db, ".. 2a .. | .. .. 1a | .. .. 2a"); // auto merge
  fsm(db, ".. 2a .. | .. .. 1b | .. 2a 1b");
  fsm(db, ".. 3. 1a | .. 2. .. | .. 2. 1a");
  fsm(db, ".. 3. 1a | .. 2a .. | .. .. 2a"); // auto merge
  fsm(db, ".. 3. 1a | .. 2b .. | .. 2b 1a");
  fsm(db, ".. 3b 1a | 2. .. .. | 2. 3b 1a");
  fsm(db, ".. 3b 1a | 2a .. .. | 2a 3b 1a");
  fsm(db, ".. 3b 1a | 2b .. .. | .. 3b 1a"); // auto resolve
  fsm(db, ".. 3b 1a | 2c .. .. | 2c 3b 1a");
}

// TODO test timestamp order view
// TODO test meta view
// TODO test content view
