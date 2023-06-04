import { testFileOperations } from "./file.test";
import { testObjectCRUD } from "./object.test";

export async function testDatabase() {
  await testFileOperations();
  await testObjectCRUD();
}
