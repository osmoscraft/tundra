import { assertDefined, assertEqual } from "../../live-test";
import { assertColumnSpec, assertFsm, createTestDb } from "./fixture";
import {
  generateFsmCanonicalSpecs,
  generateFsmDerivedColumnSpecs,
  generateFsmDeterminismSpecs,
  generateFsmSinkSpecs,
} from "./spec-gen";

export async function testDbCreation() {
  const db = await createTestDb();
  assertDefined(db, "db is defined");
}

export async function testSchemaTriggerFsmDeterminism() {
  const db = await createTestDb();

  const specs = generateFsmDeterminismSpecs();
  assertEqual(specs.length, 399, "number of total transitions should be 399");
  console.group("Determinism results: L R S | -> | L R S");
  for (const spec of specs) {
    assertFsm(db, `${spec.input} | .. .. .. | ${spec.output}`);
  }
  console.groupEnd();
}

export async function testSchemaTriggerFsmSink() {
  const db = await createTestDb();

  // all Fsm output states must be sink
  const specs = generateFsmSinkSpecs();
  console.group("Sink results: L R S | -> | L R S");
  for (const spec of specs) {
    assertFsm(db, `${spec} | .. .. .. | ${spec}`);
  }
  console.groupEnd();
}

export async function testSchemaCanonicalStates() {
  const db = await createTestDb();

  const specs = generateFsmCanonicalSpecs();
  assertEqual(specs.length, 54, "number of canonical specs should be 54");
  console.group("Canonical results: L R S | -> | L R S");
  for (const spec of specs) {
    assertFsm(db, `${spec} | .. .. .. | ${spec}`);
  }
  console.groupEnd();
}

export async function testSchemaDerivedColumns() {
  const db = await createTestDb();

  const specs = generateFsmDerivedColumnSpecs();
  assertEqual(specs.length, 53, "number of derivable specs should be 53"); // 54 - 1 (empty)

  console.group("Derived columns");
  for (const spec of specs) {
    assertColumnSpec(db, spec);
  }
  console.groupEnd();
}
