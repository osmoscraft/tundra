import { testFileOperations } from "./tests/file.test";
import { testObjectCRUD } from "./tests/object.test";

export async function checkHealth() {
  await testFileOperations();
  await testObjectCRUD();
}
