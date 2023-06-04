import { assertDeepEqual, assertDefined, assertEqual, assertUndefined } from "../../live-test";
import { deleteAllObjects, deleteObject, getObject, setObject } from "../object";
import SCHEMA from "../schema.sql";
import { createTestDb } from "./fixture";

export async function testObjectCRUD() {
  console.log("[test] objectCRUD");
  const db = await createTestDb(SCHEMA);

  setObject(db, "some-key", { a: 1, b: "", c: null, d: true, e: undefined, f: [], g: {} });
  const result1 = getObject(db, "some-key");
  assertDeepEqual(
    result1,
    { a: 1, b: "", c: null, d: true, e: undefined, f: [], g: {} },
    "object after write and read"
  );

  setObject(db, "some-key", { a: 2 });
  const result2 = getObject(db, "some-key");
  assertDeepEqual(result2, { a: 2 }, "object after update");

  deleteObject(db, "some-key");
  const result3 = getObject(db, "some-key");
  assertEqual(result3, undefined, "object after delete");

  setObject(db, "obj-1", { a: 1 });
  setObject(db, "obj-2", { a: 1 });
  assertDefined(getObject(db, "obj-1"), "obj-1 is defined");
  assertDefined(getObject(db, "obj-2"), "obj-2 is defined");
  deleteAllObjects(db);
  assertUndefined(getObject(db, "obj-1"), "obj-1 is undefined after clear");
  assertUndefined(getObject(db, "obj-2"), "obj-2 is undefined after clear");
}
