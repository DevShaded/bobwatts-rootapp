import {
  ChannelType, ErrorCodeType, RootApiException, RootGuidType, RootGuidUtils,
  RootServerException as SdkRootServerException, WellKnownRootGuids,
  type Client, type CommunityJoinedEvent, type RootServer, type ChannelGuid,
} from "@rootsdk/server-app";
import { WelcomeError, type WelcomeConfiguration, type WelcomeDestination } from "@bobwatts-rootapp/gen-shared";
import type { PrismaClient } from "../generated/prisma";
import { renderWelcomeGreeting, welcomeGreetingProblem } from "./welcomeGreeting";

type WelcomeApi = Pick<RootServer["community"], "communities" | "channelGroups" | "channels" | "communityMembers" | "communityRoles" | "channelMessages">;

// SDK 0.21.3 classifies RPC errors by constructor name, but minifies its own
// exception class. Preserve the expected name so clients receive our error codes.
class RootServerException extends SdkRootServerException {}

export class Welcome {
  constructor(
    private readonly database: PrismaClient,
    private readonly communityId: string,
    private readonly api: WelcomeApi,
    private readonly logger: Pick<Console, "error"> = console,
  ) {}

  async loadEditor(client: Client) {
    await this.requireAdministrator(client);
    const [member, configuration, destinations] = await Promise.all([
      this.api.communityMembers.get({ userId: client.userId }),
      this.configuration(),
      this.destinations(),
    ]);
    return {
      configuration,
      destinations,
      previewMember: { userId: client.userId, nickname: member.nickname },
    };
  }

  async handleJoin(event: CommunityJoinedEvent): Promise<void> {
    try {
      if (event.communityId !== this.communityId || RootGuidUtils.toRootGuidType(event.userId) !== RootGuidType.Person) return;
      const configuration = await this.configuration();
      if (!configuration.enabled || !configuration.destinationId) return;
      const member = await this.api.communityMembers.get({ userId: event.userId });
      const content = renderWelcomeGreeting(configuration.greeting, { userId: event.userId, nickname: member.nickname });
      await this.api.channelMessages.create({ channelId: configuration.destinationId as ChannelGuid, content });
    } catch (error) {
      this.logger.error("Welcome message could not be sent.", { communityId: event.communityId, userId: event.userId, error });
    }
  }

  async save(configuration: WelcomeConfiguration, client: Client): Promise<WelcomeConfiguration> {
    await this.requireAdministrator(client);
    if (configuration.enabled) {
      const problem = welcomeGreetingProblem(configuration.greeting);
      if (problem) throw new RootServerException(WelcomeError.INVALID_CONFIGURATION, problem);
      const destinations = await this.destinations();
      if (!destinations.some((destination) => destination.id === configuration.destinationId)) {
        throw new RootServerException(WelcomeError.INVALID_CONFIGURATION, "Choose a text channel the app can view and post in before enabling welcome messages.");
      }
    }
    const data = {
      enabled: configuration.enabled,
      destinationId: configuration.destinationId ?? null,
      greeting: configuration.greeting,
    };
    // One upsert commits every editable field together before returning saved state.
    const saved = await this.database.welcomeConfiguration.upsert({
      where: { id: 1 }, create: { id: 1, ...data }, update: data,
    });
    return { enabled: saved.enabled, destinationId: saved.destinationId ?? undefined, greeting: saved.greeting };
  }

  private async configuration(): Promise<WelcomeConfiguration> {
    const saved = await this.database.welcomeConfiguration.findUnique({ where: { id: 1 } });
    return saved
      ? { enabled: saved.enabled, destinationId: saved.destinationId ?? undefined, greeting: saved.greeting }
      : { enabled: false, destinationId: undefined, greeting: "Welcome {user}! Glad you’re here." };
  }

  private async requireAdministrator(client: Client): Promise<void> {
    if (client.communityId !== this.communityId) this.denyAccess();
    const community = await this.api.communities.get();
    if (community.ownerUserId === client.userId) return;
    const member = await this.api.communityMembers.get({ userId: client.userId }).catch((error: unknown) => {
      if (error instanceof RootApiException && error.errorCode === ErrorCodeType.NotFound) this.denyAccess();
      throw error;
    });
    const roles = await this.api.communityRoles.list();
    const roleIds = new Set([...member.communityRoleIds, WellKnownRootGuids.CommunityRoles.EveryoneRole]);
    if (roles.some((role) => roleIds.has(role.id) &&
      (role.communityPermission.communityFullControl || role.communityPermission.communityManageApps))) return;
    this.denyAccess();
  }

  private async destinations(): Promise<WelcomeDestination[]> {
    const groups = await this.api.channelGroups.list();
    const destinations: WelcomeDestination[] = [];
    // Fetch one group at a time so larger communities do not burst Root API limits.
    for (const group of groups) {
      const channels = await this.api.channels.list({ channelGroupId: group.id });
      for (const channel of channels) {
        if (channel.channelType === ChannelType.Text && channel.channelPermission.channelView &&
          channel.channelPermission.channelCreateMessage) {
          destinations.push({ id: channel.id, name: channel.name });
        }
      }
    }
    return destinations;
  }

  private denyAccess(): never {
    throw new RootServerException(WelcomeError.ACCESS_DENIED, "Only the community owner or members with Full Control or Manage Apps can access welcome settings.");
  }
}
