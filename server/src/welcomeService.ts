import type { Client } from "@rootsdk/server-app";
import type { WelcomeConfiguration, WelcomeEditorState } from "@bobwatts-rootapp/gen-shared";
import { WelcomeServiceBase } from "@bobwatts-rootapp/gen-server";
import type { Welcome } from "./welcome";

export class WelcomeService extends WelcomeServiceBase {
  constructor(private readonly welcome: Welcome) {
    super();
  }

  loadEditor(client: Client): Promise<WelcomeEditorState> {
    return this.welcome.loadEditor(client);
  }

  save(request: WelcomeConfiguration, client: Client): Promise<WelcomeConfiguration> {
    return this.welcome.save(request, client);
  }
}
