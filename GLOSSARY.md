# BobWatts Community Welcome

The community welcome feature lets administrators configure a greeting for members joining their community.

## Language

**Administrator**:
A community owner or a member with Full Control or Manage Apps permission, authorized to view and change the welcome configuration.

**Welcome configuration**:
A community's shared choices for whether welcome messages are enabled, their destination text channel, and their welcome greeting.
_Avoid_: Welcome rule, welcome campaign

**Welcome greeting**:
The administrator-written text used to compose welcome messages, which can contain the user placeholder.
_Avoid_: Welcome message template

**User placeholder**:
The `{user}` token in a welcome greeting, representing a mention of the member who joins the community.
_Avoid_: Username placeholder, user variable

**Welcome message**:
A message addressed to a human member when they join the community, composed from its welcome greeting and posted in its chosen text channel. A member who leaves and rejoins can receive another welcome message.
_Avoid_: Greeting template, join notification
