import { rootServer, CommunityEvent, type CommunityJoinedEvent, type RootAppStartState } from "@rootsdk/server-app";
import { WelcomeService } from "./welcomeService";
import { Welcome } from "./welcome";
import { openDatabase } from "./database";

let database: Awaited<ReturnType<typeof openDatabase>> | undefined;
let onJoined: ((event: CommunityJoinedEvent) => Promise<void>) | undefined;

async function onStarting(state: RootAppStartState) {
  const filename = rootServer.dataStore.config.sqlite3?.filename;
  if (!filename) throw new Error("Root did not provide a SQLite database filename.");
  database = await openDatabase(filename);
  const welcome = new Welcome(database, state.communityId, rootServer.community);
  rootServer.lifecycle.addService(new WelcomeService(welcome));
  onJoined = (event) => welcome.handleJoin(event);
  rootServer.community.communities.on(CommunityEvent.CommunityJoined, onJoined);
}

async function onStopping() {
  if (onJoined) rootServer.community.communities.off(CommunityEvent.CommunityJoined, onJoined);
  await database?.$disconnect();
}

(async () => {
  await rootServer.lifecycle.start(onStarting, onStopping);
})();
