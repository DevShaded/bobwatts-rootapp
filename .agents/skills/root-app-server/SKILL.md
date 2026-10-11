---
name: root-app-server
description: Build, review, or troubleshoot Root App backends using TypeScript and @rootsdk/server-app. Use for lifecycle initialization, community event handlers, permissions, API operations, error handling, rate limits, and backend architecture.
---

# Root App Server

## Scope

For guidance requests, provide explanations and commands without changing
files. Implement changes only when requested.

Keep this skill focused on server behavior. Use dedicated networking,
persistence, and moderation skills when those concerns become substantial.

## Official references

- https://docs.rootapp.com/docs/app-docs/develop/server/
- https://docs.rootapp.com/docs/app-docs/develop/server/community-api/
- https://docs.rootapp.com/docs/app-docs/develop/server/community-api/rate-limits/
- https://docs.rootapp.com/docs/app-api-reference/server/

Read the relevant documentation before implementation. Verify exact methods,
event names, request shapes, and permissions against installed SDK types.
Do not invent APIs or assume Discord equivalents exist.

## Workflow

1. Inspect the manifest, package versions, entry point, and existing services.
2. Identify the triggering event or request and the required community APIs.
3. Check required manifest permissions and resource access.
4. Implement a small handler that delegates business logic to focused modules.
5. Add appropriate persistence and failure handling.
6. Verify the behavior and report any untested integration points.

## Lifecycle

- Use rootServer.lifecycle.start to start the server.
- Initialize services, storage, and subscriptions in the startup callback.
- Register networking services with rootServer.lifecycle.addService.
- Expect restarts; keep durable state outside process memory.
- Use shutdown callbacks for orderly cleanup, but do not rely on them
  being called after a crash.
- Avoid duplicate listeners when initializing or reconnecting.

## Community interactions

- Limit operations to the intended community and accessible resources.
- Keep the App's platform permissions separate from the requesting
  member's authorization.
- Validate input and check authorization before privileged operations.
- Prevent message handlers from responding recursively to App messages.
- Handle unknown, missing, or deleted resources explicitly.

## Failures and rate limits

- Handle RootApiException using documented error codes.
- Pace bulk operations and bound concurrency.
- Use capped exponential backoff with jitter for transient failures.
- Do not retry permission or validation errors unchanged.
- Before retrying a mutation after a timeout, consider whether it already
  succeeded. Reconcile or deduplicate when necessary.
- Do not treat every unknown exception as a retryable network failure.
- Check current limits rather than treating documented numbers as permanent.

## Verification

Check relevant startup, authorization, API failure, and restart behavior.
Use mocks for isolated logic and a test community for integration checks.
Do not run destructive integration checks against a live community.

Report what changed, which checks ran, and what remains unverified.
