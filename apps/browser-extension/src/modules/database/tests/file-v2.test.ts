import { assertDefined } from "../../live-test";
import SCHEMA from "../schema.sql";
import { createTestDb, fsm } from "./fixture";

export async function testFileV2Db() {
  const db = await createTestDb(SCHEMA);
  assertDefined(db, "db is defined");
}

export async function testFileV2StatusUntracked() {
  const db = await createTestDb(SCHEMA);

  // static
  fsm(db, ".. .. .. | .. .. .. | .. .. ..");

  // valid transitions
  fsm(db, ".. .. .. | .. .. 1c | .. .. 1c");
  fsm(db, ".. .. .. | .. .. 1. | .. .. ..");
  fsm(db, ".. .. .. | .. 1b .. | .. 1b ..");
  fsm(db, ".. .. .. | .. 1. .. | .. 1. ..");
  fsm(db, ".. .. .. | 1a .. .. | 1a .. ..");
  fsm(db, ".. .. .. | 1. .. .. | .. .. ..");
}

export async function testFileV2StatusSynced() {
  const db = await createTestDb(SCHEMA);

  // static
  fsm(db, ".. .. 1. | .. .. .. | .. .. .."); // collapse
  fsm(db, ".. .. 1a | .. .. .. | .. .. 1a");

  // TODO timestamp constraint
  // fsm(db, ".. .. 2a | .. .. 1. | .. .. 2a");
  // fsm(db, ".. .. 2a | .. .. 1a | .. .. 2a");
  // fsm(db, ".. .. 2a | .. .. 1b | .. .. 2a");
  // fsm(db, ".. .. 2a | .. 1. .. | .. .. 2a");
  // fsm(db, ".. .. 2a | .. 1a .. | .. .. 2a");
  // fsm(db, ".. .. 2a | .. 1b .. | .. .. 2a");

  // valid transitions
  fsm(db, ".. .. 1a | .. .. 2. | .. .. ..");
  fsm(db, ".. .. 1a | .. .. 2a | .. .. 2a");
  fsm(db, ".. .. 1a | .. .. 2b | .. .. 2b");
  fsm(db, ".. .. 1a | .. 2. .. | .. 2. 1a");
  fsm(db, ".. .. 1a | .. 2a .. | .. 2a 1a"); // ?
  fsm(db, ".. .. 1a | .. 2b .. | .. 2b 1a");
  fsm(db, ".. .. 1a | 2. .. .. | 2. .. 1a");
  fsm(db, ".. .. 1a | 2a .. .. | .. .. 1a"); // noop
  fsm(db, ".. .. 1a | 2b .. .. | 2b .. 1a");
}

export async function testFileV2StatusBehind() {
  const db = await createTestDb(SCHEMA);

  // static
  fsm(db, ".. 1. .. | .. .. .. | .. 1. ..");
  fsm(db, ".. 1a .. | .. .. .. | .. 1a ..");
  fsm(db, ".. 2. 1a | .. .. .. | .. 2. 1a");
  fsm(db, ".. 2a 1a | .. .. .. | .. 2a 1a"); // ?
  fsm(db, ".. 2b 1a | .. .. .. | .. 2b 1a");
  fsm(db, ".. 2. 1. | .. .. .. | .. 2. 1."); // ?
  fsm(db, ".. 2a 1. | .. .. .. | .. 2a 1.");

  // TODO timestamp constraint

  // valid transitions
  // fsm(db, ".. 1a .. | .. .. 2. | .. .. ..");
  // fsm(db, ".. 1a .. | .. .. 2a | .. .. 2a");
  // fsm(db, ".. 1a .. | .. .. 2b | .. .. 2b");
  fsm(db, ".. 1a .. | .. 2. .. | .. 2. ..");
  fsm(db, ".. 1a .. | .. 2a .. | .. 2a ..");
  fsm(db, ".. 1a .. | .. 2b .. | .. 2b ..");
  fsm(db, ".. 1a .. | 2. .. .. | 2. 1a ..");
  fsm(db, ".. 1a .. | 2a .. .. | 2a 1a .."); // ?
  fsm(db, ".. 1a .. | 2b .. .. | 2b 1a ..");

  // fsm(db, ".. 2. 1. | .. .. 3. | .. .. ..");
  // fsm(db, ".. 2. 1. | .. .. 3a | .. .. 3a");
  fsm(db, ".. 2. 1. | .. 3. .. | .. 3. 1.");
  fsm(db, ".. 2. 1. | .. 3a .. | .. 3a 1.");
  fsm(db, ".. 2. 1. | 3. .. .. | 3. 2. 1."); // ?
  fsm(db, ".. 2. 1. | 3a .. .. | 3a 2. 1."); // ?

  // fsm(db, ".. 2a 1. | .. .. 3. | .. .. ..");
  // fsm(db, ".. 2a 1. | .. .. 3a | .. .. 3a");
  // fsm(db, ".. 2a 1. | .. .. 3b | .. .. 3b");
  fsm(db, ".. 2a 1. | .. 3. .. | .. 3. 1."); // ?
  fsm(db, ".. 2a 1. | .. 3a .. | .. 3a 1.");
  fsm(db, ".. 2a 1. | .. 3b .. | .. 3b 1.");
  fsm(db, ".. 2a 1. | 3. .. .. | 3. 2a 1.");
  fsm(db, ".. 2a 1. | 3a .. .. | 3a 2a 1."); // ?
  fsm(db, ".. 2a 1. | 3b .. .. | 3b 2a 1.");

  // fsm(db, ".. 2. 1a | .. .. 3. | .. .. ..");
  // fsm(db, ".. 2. 1a | .. .. 3a | .. .. 3a");
  // fsm(db, ".. 2. 1a | .. .. 3b | .. .. 3b");
  fsm(db, ".. 2. 1a | .. 3. .. | .. 3. 1a");
  fsm(db, ".. 2. 1a | .. 3a .. | .. 3a 1a"); // ?
  fsm(db, ".. 2. 1a | .. 3b .. | .. 3b 1a");
  fsm(db, ".. 2. 1a | 3. .. .. | 3. 2. 1a");
  fsm(db, ".. 2. 1a | 3a .. .. | 3a 2. 1a"); // ?
  fsm(db, ".. 2. 1a | 3b .. .. | 3b 2. 1a");

  // fsm(db, ".. 2b 1a | .. .. 3. | .. .. ..");
  // fsm(db, ".. 2b 1a | .. .. 3a | .. .. 3a");
  // fsm(db, ".. 2b 1a | .. .. 3b | .. .. 3b");
  fsm(db, ".. 2b 1a | .. 3. .. | .. 3. 1a");
  fsm(db, ".. 2b 1a | .. 3a .. | .. 3a 1a"); // ?
  fsm(db, ".. 2b 1a | .. 3b .. | .. 3b 1a");
  fsm(db, ".. 2b 1a | 3. .. .. | 3. 2b 1a");
  fsm(db, ".. 2b 1a | 3a .. .. | 3a 2b 1a");
  fsm(db, ".. 2b 1a | 3b .. .. | 3b 2b 1a"); // ?
}

// TODO test timestamp order view
// TODO test meta view
// TODO test content view
