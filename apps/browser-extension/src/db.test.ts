import { runLiveTests } from "./modules/live-test/run-live-tests";

async function runDbTests() {
  await runLiveTests();
}

runDbTests();
