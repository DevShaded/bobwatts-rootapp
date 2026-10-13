const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { test } = require("node:test");
// The SDK requires a community context even when its API is replaced by a fake.
const communityBytes = Buffer.alloc(16);
communityBytes[7] = 2;
process.env.COMMUNITY_ID = communityBytes.toString("base64url");
delete process.env.DATABASE_CONFIG;
const { openDatabase } = require("../dist/database");
const { Welcome } = require("../dist/welcome");
const { WelcomeError } = require("@bobwatts-rootapp/gen-shared");
const { WellKnownRootGuids } = require("@rootsdk/server-app");
const { ChannelType } = require("@rootsdk/server-app");
const { RootApiException, ErrorCodeType } = require("@rootsdk/server-app");

const communityId = "community";
const owner = { communityId, userId: "owner" };
const personBytes = Buffer.alloc(16);
personBytes[7] = 1;
const personId = personBytes.toString("base64url");

async function setup(t) {
  const directory = await mkdtemp(join(tmpdir(), "bobwatts-welcome-"));
  const filename = join(directory, "root.sqlite3");
  const database = await openDatabase(filename);
  t.after(async () => {
    await database.$disconnect();
    await rm(directory, { recursive: true, force: true });
  });
  const messages = [];
  const failures = [];
  const api = {
    communities: { get: async () => ({ communityId, ownerUserId: owner.userId }) },
    communityMembers: { get: async ({ userId }) => ({ userId, nickname: "Alice", communityRoleIds: [] }) },
    communityRoles: { list: async () => [] },
    channelGroups: { list: async () => [{ id: "group" }] },
    channels: { list: async () => [{
      id: "welcome-channel", name: "welcome", channelType: ChannelType.Text,
      channelPermission: { channelView: true, channelCreateMessage: true },
    }] },
    channelMessages: { create: async (message) => { messages.push(message); return message; } },
  };
  return { welcome: new Welcome(database, communityId, api, { error: (...args) => failures.push(args) }), database, filename, api, messages, failures };
}

test("an administrator opens the initial disabled welcome configuration", async (t) => {
  const { welcome } = await setup(t);
  assert.deepEqual(await welcome.loadEditor(owner), {
    configuration: {
      enabled: false,
      destinationId: undefined,
      greeting: "Welcome {user}! Glad you’re here.",
    },
    destinations: [{ id: "welcome-channel", name: "welcome" }],
    previewMember: { userId: owner.userId, nickname: "Alice" },
  });
});

test("authorized editor loading supplies the caller's identity without posting or activating drafts", async (t) => {
  const { welcome, api, messages } = await setup(t);
  api.communityMembers.get = async ({ userId }) => ({
    nickname: userId === owner.userId ? "Admin [name]*" : "Joining member", communityRoleIds: [],
  });
  const saved = { enabled: true, destinationId: "welcome-channel", greeting: "Welcome {user}!" };
  await welcome.save(saved, owner);
  const editor = await welcome.loadEditor(owner);
  assert.deepEqual(editor.previewMember, { userId: owner.userId, nickname: "Admin [name]*" });
  editor.configuration.greeting = "Unsaved preview for {user}";
  assert.deepEqual(messages, []);
  assert.deepEqual((await welcome.loadEditor(owner)).configuration, saved);
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, [{
    channelId: "welcome-channel", content: `Welcome [@Joining member](root://user/${personId})!`,
  }]);
});

test("a subsequent human join sends the saved greeting with every exact user placeholder mentioned", async (t) => {
  const { welcome, api, messages } = await setup(t);
  api.communityMembers.get = async () => ({ nickname: "A[li]ce\\*_<>\n&", communityRoleIds: [] });
  const draft = { enabled: true, destinationId: "welcome-channel", greeting: "**Hello {user}!**\nVisit https://example.com, {user}." };
  await welcome.save(draft, owner);
  draft.enabled = false;
  draft.greeting = "unsaved";
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, [{
    channelId: "welcome-channel",
    content: `**Hello [@A\\[li\\]ce\\\\\\*\\_&lt;&gt; &amp;](root://user/${personId})!**\nVisit https://example.com, [@A\\[li\\]ce\\\\\\*\\_&lt;&gt; &amp;](root://user/${personId}).`,
  }]);
});

test("Save persists the entire canonical welcome configuration and later draft edits stay local", async (t) => {
  const { welcome } = await setup(t);
  const draft = { enabled: true, destinationId: "welcome-channel", greeting: "Hello {user}!" };
  assert.deepEqual(await welcome.save(draft, owner), draft);
  draft.enabled = false;
  draft.destinationId = "unsaved-channel";
  draft.greeting = "unsaved";
  assert.deepEqual((await welcome.loadEditor(owner)).configuration, {
    enabled: true, destinationId: "welcome-channel", greeting: "Hello {user}!",
  });
});

test("destination choices include only visible, writable standard community Text channels", async (t) => {
  const { welcome, api } = await setup(t);
  api.channelGroups.list = async () => [{ id: "group-a" }, { id: "group-b" }];
  const channel = (id, channelType, channelView, channelCreateMessage) => ({
    id, name: id, channelType, channelPermission: { channelView, channelCreateMessage },
  });
  api.channels.list = async ({ channelGroupId }) => channelGroupId === "group-a" ? [
    channel("general", ChannelType.Text, true, true),
    channel("threads", ChannelType.ThreadedText, true, true),
    channel("hidden", ChannelType.Text, false, true),
    channel("read-only", ChannelType.Text, true, false),
    channel("voice", ChannelType.Voice, true, true),
    channel("app", ChannelType.App, true, true),
  ] : [channel("welcome", ChannelType.Text, true, true)];
  assert.deepEqual((await welcome.loadEditor(owner)).destinations, [
    { id: "general", name: "general" }, { id: "welcome", name: "welcome" },
  ]);
});

test("every settings operation rejects unauthorized or foreign-community callers", async (t) => {
  const { welcome } = await setup(t);
  for (const client of [
    { communityId, userId: "ordinary-member", administrator: true },
    { communityId: "other-community", userId: owner.userId },
  ]) {
    await assert.rejects(welcome.loadEditor(client), { code: WelcomeError.ACCESS_DENIED });
    await assert.rejects(welcome.save({}, client), { code: WelcomeError.ACCESS_DENIED });
  }
});

test("a caller without community membership receives access-denied feedback", async (t) => {
  const { welcome, api } = await setup(t);
  api.communityMembers.get = async () => {
    throw Object.assign(new RootApiException("Member not found"), { errorCode: ErrorCodeType.NotFound });
  };
  const client = { communityId, userId: "non-member" };
  await assert.rejects(welcome.loadEditor(client), { code: WelcomeError.ACCESS_DENIED });
  await assert.rejects(welcome.save({ enabled: false, greeting: "" }, client), { code: WelcomeError.ACCESS_DENIED });
});

test("Full Control and Manage Apps administrators can open settings", async (t) => {
  const { welcome, api } = await setup(t);
  api.communityMembers.get = async () => ({ communityRoleIds: ["assigned-role"] });
  for (const permission of ["communityFullControl", "communityManageApps"]) {
    api.communityRoles.list = async () => [
      { id: "assigned-role", communityPermission: { [permission]: true } },
    ];
    const client = { communityId, userId: "admin" };
    assert.deepEqual((await welcome.loadEditor(client)).destinations, [{ id: "welcome-channel", name: "welcome" }]);
    const saved = { enabled: true, destinationId: "welcome-channel", greeting: `Hello from ${permission}` };
    assert.deepEqual(await welcome.save(saved, client), saved);
    assert.deepEqual((await welcome.loadEditor(client)).configuration, saved);
  }
  api.communityMembers.get = async () => ({ communityRoleIds: [] });
  api.communityRoles.list = async () => [
    { id: WellKnownRootGuids.CommunityRoles.EveryoneRole, communityPermission: { communityManageApps: true } },
  ];
  assert.equal((await welcome.loadEditor({ communityId, userId: "admin" })).configuration.enabled, true);
  api.communityRoles.list = async () => [
    { id: "unassigned-role", communityPermission: { communityFullControl: true } },
  ];
  await assert.rejects(welcome.loadEditor({ communityId, userId: "member" }), { code: WelcomeError.ACCESS_DENIED });
});

test("human rejoins and duplicate notifications each qualify; App accounts and other communities do not", async (t) => {
  const { welcome, messages } = await setup(t);
  await welcome.save({ enabled: true, destinationId: "welcome-channel", greeting: "Welcome aboard!" }, owner);
  const human = { communityId, userId: personId };
  await welcome.handleJoin(human);
  await welcome.handleJoin(human); // A leave/rejoin has the same public join input.
  await welcome.handleJoin(human); // Root may deliver that notification again.
  const appBytes = Buffer.alloc(16);
  appBytes[7] = 9;
  await welcome.handleJoin({ communityId, userId: appBytes.toString("base64url") });
  await welcome.handleJoin({ communityId: "other-community", userId: personId });
  assert.deepEqual(messages, Array(3).fill({ channelId: "welcome-channel", content: "Welcome aboard!" }));
});

test("disabled saved configuration produces no welcome despite an unsaved enable", async (t) => {
  const { welcome, messages } = await setup(t);
  await welcome.handleJoin({ communityId, userId: personId });
  await welcome.save({ enabled: true, destinationId: "welcome-channel", greeting: "Hello!" }, owner);
  const draft = await welcome.save({ enabled: false, destinationId: "welcome-channel", greeting: "Hello!" }, owner);
  draft.enabled = true;
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, []);
});

test("failed sends log once without retries, and future human joins can still send", async (t) => {
  const { welcome, api, messages, failures } = await setup(t);
  const saved = { enabled: true, destinationId: "welcome-channel", greeting: "Hello!" };
  await welcome.save(saved, owner);
  let attempts = 0;
  api.channelMessages.create = async () => { attempts++; throw new Error("No permission to create"); };
  await welcome.handleJoin({ communityId, userId: personId });
  assert.equal(attempts, 1);
  assert.equal(failures.length, 1);
  assert.deepEqual((await welcome.loadEditor(owner)).configuration, saved);
  api.channelMessages.create = async (message) => { messages.push(message); return message; };
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, [{ channelId: "welcome-channel", content: "Hello!" }]);
});

test("saved settings survive reopening the database and repeated startup", async (t) => {
  const { welcome, database, filename, api, messages } = await setup(t);
  const saved = { enabled: true, destinationId: "welcome-channel", greeting: "Hello after restart, {user}!" };
  await welcome.save(saved, owner);
  await database.$disconnect();
  for (let startup = 0; startup < 2; startup++) {
    const reopened = await openDatabase(filename);
    try {
      const restarted = new Welcome(reopened, communityId, api);
      assert.deepEqual((await restarted.loadEditor(owner)).configuration, saved);
      await restarted.handleJoin({ communityId, userId: personId });
    } finally {
      await reopened.$disconnect();
    }
  }
  assert.deepEqual(messages, Array(2).fill({
    channelId: "welcome-channel", content: `Hello after restart, [@Alice](root://user/${personId})!`,
  }));
});

test("enabled saves require an eligible destination and non-whitespace greeting; rejected saves retain settings", async (t) => {
  const { welcome, api } = await setup(t);
  const valid = { enabled: true, destinationId: "welcome-channel", greeting: "Hello!" };
  await welcome.save(valid, owner);
  for (const invalid of [
    { ...valid, destinationId: undefined },
    { ...valid, destinationId: "missing" },
    { ...valid, greeting: "" },
    { ...valid, greeting: " \n\t " },
  ]) {
    await assert.rejects(welcome.save(invalid, owner), { code: WelcomeError.INVALID_CONFIGURATION });
    assert.deepEqual((await welcome.loadEditor(owner)).configuration, valid);
  }
  api.channels.list = async () => [{
    id: "welcome-channel", name: "welcome", channelType: ChannelType.Text,
    channelPermission: { channelView: true, channelCreateMessage: false },
  }];
  await assert.rejects(welcome.save(valid, owner), { code: WelcomeError.INVALID_CONFIGURATION });
  assert.deepEqual((await welcome.loadEditor(owner)).configuration, valid);
});

test("disabling preserves saved fields and can save incomplete delivery fields", async (t) => {
  const { welcome, api } = await setup(t);
  const enabled = { enabled: true, destinationId: "welcome-channel", greeting: "Hello!" };
  await welcome.save(enabled, owner);
  api.channels.list = async () => { throw new Error("Root unavailable"); };
  assert.deepEqual(await welcome.save({ ...enabled, enabled: false }, owner), { ...enabled, enabled: false });
  const incomplete = { enabled: false, destinationId: undefined, greeting: "" };
  assert.deepEqual(await welcome.save(incomplete, owner), incomplete);
});

test("enabled saves reject unsupported named placeholders without changing live settings", async (t) => {
  const { welcome, messages } = await setup(t);
  const saved = { enabled: true, destinationId: "welcome-channel", greeting: "Welcome aboard!" };
  await welcome.save(saved, owner);
  for (const greeting of ["Hello {username}", "Hello {User}", "Hello {user_name}"]) {
    await assert.rejects(welcome.save({ ...saved, greeting }, owner), {
      code: WelcomeError.INVALID_CONFIGURATION,
      message: /Only \{user\} is supported/,
    });
    assert.deepEqual((await welcome.loadEditor(owner)).configuration, saved);
  }
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, [{ channelId: "welcome-channel", content: "Welcome aboard!" }]);
});

test("the greeting limit counts Unicode code points and disabling retains over-limit content", async (t) => {
  const { welcome, messages } = await setup(t);
  for (const greeting of ["a".repeat(1000), "😀".repeat(1000), "a".repeat(998) + "😀!"]) {
    const valid = { enabled: true, destinationId: "welcome-channel", greeting };
    assert.deepEqual(await welcome.save(valid, owner), valid);
    await welcome.handleJoin({ communityId, userId: personId });
    assert.equal(messages.at(-1).content, greeting);
    await assert.rejects(welcome.save({ ...valid, greeting: greeting + "😀" }, owner), {
      code: WelcomeError.INVALID_CONFIGURATION, message: /1,000 characters/,
    });
    assert.deepEqual((await welcome.loadEditor(owner)).configuration, valid);
  }
  for (const greeting of ["", " \n\t ", "{username} {User}", "😀".repeat(1001)]) {
    const disabled = { enabled: false, destinationId: "missing-channel", greeting };
    assert.deepEqual(await welcome.save(disabled, owner), disabled);
    assert.deepEqual((await welcome.loadEditor(owner)).configuration, disabled);
    const before = messages.length;
    await welcome.handleJoin({ communityId, userId: personId });
    assert.equal(messages.length, before);
  }
});

test("Root rejection after mention expansion is logged without retries or configuration changes", async (t) => {
  const { welcome, api, failures } = await setup(t);
  const saved = { enabled: true, destinationId: "welcome-channel", greeting: "{user}".repeat(166) };
  api.communityMembers.get = async () => ({ nickname: "a".repeat(100), communityRoleIds: [] });
  await welcome.save(saved, owner);
  const attempts = [];
  api.channelMessages.create = async (message) => {
    attempts.push(message);
    throw Object.assign(new RootApiException("Message content too long"), { errorCode: ErrorCodeType.RequestValidationFailed });
  };
  await welcome.handleJoin({ communityId, userId: personId });
  assert.equal(attempts.length, 1);
  assert.ok(attempts[0].content.length > 10000);
  assert.equal(failures.length, 1);
  assert.deepEqual((await welcome.loadEditor(owner)).configuration, saved);
});

test("enabled saves reject user placeholders in code or links while disabled drafts remain intact", async (t) => {
  const { welcome, messages } = await setup(t);
  const saved = { enabled: true, destinationId: "welcome-channel", greeting: "Welcome {user}!" };
  await welcome.save(saved, owner);
  for (const greeting of [
    "Hello `{user}`!",
    "```text\n{user}\n```",
    "    {user}",
    "[Hello {user}](https://example.com)",
    "[Read more](https://example.com/{user})",
    "[Hello {user}][guide]\n\n[guide]: https://example.com",
    "![Hello {user}](https://example.com/image.png)",
    "\\{user}",
    "!{user}",
    "[x](root://user/welcome&#45;placeholder) !{user}",
    "www.example.com/{user}",
    "www.example.com/[{user}]",
    "www.example.com/**{user}**",
    "www.example.invalid/{user}",
    "www.example.test/{user}",
    "www.localhost/{user}",
    "www.localhost/**{user}**",
    "www.example.invalid/&nbsp;{user}",
    "www.localhost/&#32;{user}",
  ]) {
    await assert.rejects(welcome.save({ ...saved, greeting }, owner), {
      code: WelcomeError.INVALID_CONFIGURATION, message: /Place \{user\} in ordinary greeting text/,
    }, greeting);
    assert.deepEqual((await welcome.loadEditor(owner)).configuration, saved);
  }
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, [{ channelId: "welcome-channel", content: `Welcome [@Alice](root://user/${personId})!` }]);
  const disabled = { enabled: false, destinationId: "welcome-channel", greeting: "Hello `{user}`!" };
  assert.deepEqual(await welcome.save(disabled, owner), disabled);
  assert.deepEqual((await welcome.loadEditor(owner)).configuration, disabled);
});

test("ordinary-text mentions preserve surrounding formatting and escape member backticks", async (t) => {
  const { welcome, api, messages } = await setup(t);
  api.communityMembers.get = async () => ({ nickname: "` **owned**", communityRoleIds: [] });
  const greeting = "**Hello {user}!**\nRead [our guide](https://example.com).\n`literal code` and ||{user}||";
  await welcome.save({ enabled: true, destinationId: "welcome-channel", greeting }, owner);
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, [{ channelId: "welcome-channel", content:
    `**Hello [@\\\` \\*\\*owned\\*\\*](root://user/${personId})!**\nRead [our guide](https://example.com).\n\`literal code\` and ||[@\\\` \\*\\*owned\\*\\*](root://user/${personId})||`,
  }]);
});

test("legacy enabled greetings with unsafe placeholder placement are logged and preserved without sending", async (t) => {
  const { welcome, database, messages, failures } = await setup(t);
  const legacy = { enabled: true, destinationId: "welcome-channel", greeting: "Hello `{user}`!" };
  // Seed a configuration accepted by the previous application version.
  await database.welcomeConfiguration.create({ data: { id: 1, ...legacy } });
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, []);
  assert.equal(failures.length, 1);
  assert.deepEqual((await welcome.loadEditor(owner)).configuration, legacy);
  assert.deepEqual(await welcome.save({ ...legacy, enabled: false }, owner), { ...legacy, enabled: false });
});

test("ordinary placeholders beside encoded mention links and separated bare URLs still send", async (t) => {
  const { welcome, messages } = await setup(t);
  const greeting = "[x](root://user/welcome&#45;placeholder) www.example.com {user}";
  await welcome.save({ enabled: true, destinationId: "welcome-channel", greeting }, owner);
  await welcome.handleJoin({ communityId, userId: personId });
  assert.deepEqual(messages, [{ channelId: "welcome-channel", content:
    `[x](root://user/welcome&#45;placeholder) www.example.com [@Alice](root://user/${personId})`,
  }]);
});
