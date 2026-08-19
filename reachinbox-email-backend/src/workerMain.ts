import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { startEmailWorkerProcess } from "./worker/startWorker";

async function main() {
  await startEmailWorkerProcess();
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
