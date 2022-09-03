import { getFileModule } from "./modules/file/file";
import { getNewId } from "./utils/id";

export async function main() {
  console.log("App initialized");

  const fileModule = getFileModule();
  fileModule.eventTarget.addEventListener("changed", (e) => console.log((e as CustomEvent).detail));
  const files = await fileModule.putFiles([{ id: getNewId(), body: "test" }]);
  console.log("Task finished", files);
}

main();
