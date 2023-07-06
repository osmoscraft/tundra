import { assertDefined } from "../../live-test";
import SCHEMA from "../schema.sql";
import { createTestDb, fsm } from "./fixture";
import { generateFsmSpecs } from "./spec-gen";

export async function testFileV2Db() {
  const db = await createTestDb(SCHEMA);
  assertDefined(db, "db is defined");
}

export async function testFileV2Fsm() {
  const db = await createTestDb(SCHEMA);

  const specs = generateFsmSpecs();
  for (const spec of specs) {
    fsm(db, `${spec.input} | .. .. .. | ${spec.output}`);
  }
}
