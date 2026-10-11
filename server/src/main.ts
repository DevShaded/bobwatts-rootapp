import { rootServer, RootAppStartState } from "@rootsdk/server-app";
import { echoService } from "./exampleService"; // TODO: remove this line when you no longer need the example code
import { openDatabase } from "./database";

let database: Awaited<ReturnType<typeof openDatabase>> | undefined;

async function onStarting(state: RootAppStartState) {
  const filename = rootServer.dataStore.config.sqlite3?.filename;
  if (!filename) throw new Error("Root did not provide a SQLite database filename.");
  database = await openDatabase(filename);
  rootServer.lifecycle.addService(echoService); // TODO: remove this line when you no longer need the example code
}

async function onStopping() {
  await database?.$disconnect();
}

(async () => {
  await rootServer.lifecycle.start(onStarting, onStopping);
})();
