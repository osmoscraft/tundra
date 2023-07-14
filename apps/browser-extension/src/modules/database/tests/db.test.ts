import { assertDefined } from "../../live-test";
import SCHEMA from "../schema.sql";
import { createTestDb, fsm } from "./fixture";
import { generateFsmDerivedColumnSpecs, generateFsmDeterminismSpecs, generateFsmSinkSpecs } from "./spec-gen";

export async function testDbCreation() {
  const db = await createTestDb(SCHEMA);
  assertDefined(db, "db is defined");
}

export async function testSchemaTriggerFsmDeterminism() {
  const db = await createTestDb(SCHEMA);

  const specs = generateFsmDeterminismSpecs();
  console.groupCollapsed("Determinism results: L R S | -> | L R S");
  for (const spec of specs) {
    fsm(db, `${spec.input} | .. .. .. | ${spec.output}`);
  }
  console.groupEnd();
}

export async function testSchemaTriggerFsmSink() {
  const db = await createTestDb(SCHEMA);

  const specs = generateFsmSinkSpecs();
  console.groupCollapsed("Sink results: L R S | -> | L R S");
  for (const spec of specs) {
    fsm(db, `${spec.input} | .. .. .. | ${spec.output}`);
  }
  console.groupEnd();
}

export async function testSchemaDerivedColumns() {
  const specs = generateFsmDerivedColumnSpecs();
  console.log(specs);
}
