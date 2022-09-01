import { GraphModule } from "./modules/graph/graph.module";

async function main() {
  const fileModule = new GraphModule();

  await fileModule.installModules(["foo", "bar"]);

  console.log("App initialized");
}

main();
