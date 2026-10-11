---
name: root-app-networking
description: Define, implement, or review communication between Root App frontends and backends. Use for Protobuf contracts, generated TypeScript bindings, service implementations, broadcasts, caller authorization, pagination, and client-server errors.
---

# Root App Networking

## Scope

Provide instructions when the user asks for guidance. Modify contracts and
implementation only when requested.

## Official references

- https://docs.rootapp.com/docs/app-docs/develop/networking/
- https://docs.rootapp.com/docs/app-docs/develop/networking/implement-service/
- https://docs.rootapp.com/docs/app-docs/develop/networking/plan-services/
- https://docs.rootapp.com/docs/app-docs/develop/networking/handle-exceptions/

Check current documentation and installed generated types before coding.

## Contract workflow

1. Inspect networking source files, root-protoc.json, and workspace scripts.
2. Define the operation, caller, request, response, and permitted audience.
3. Update the Protobuf source.
4. Generate bindings using the project's Root SDK build commands.
5. Extend the generated server base class and implement its methods.
6. Register the service during server startup.
7. Connect the frontend through generated client bindings.

Never edit generated files to implement business logic.

## Contract design

- Keep requests and responses specific to the operation.
- Preserve existing Protobuf field numbers.
- Reserve removed field numbers and names instead of reusing them.
- Validate lengths, identifiers, enum values, and pagination inputs.
- Return only the fields the caller is allowed to see.
- Paginate histories and leaderboards; avoid unbounded responses.
- Check current payload limits before designing large transfers.

## Identity and authorization

- Derive the acting user's identity from the SDK-provided Client context.
- Treat user IDs supplied in request bodies as targets, not proof of identity.
- Check permissions on the server for reads and writes.
- Never rely on hidden frontend controls to enforce authorization.

## Responses and broadcasts

- Persist successful changes before announcing them.
- Select broadcast recipients explicitly.
- Do not broadcast private moderation records or settings to all clients.
- Account for the initiating device receiving a response and potentially
  an event; prevent duplicate UI updates.
- Unsubscribe frontend listeners when their owner unmounts.
- Provide a way to refresh authoritative state after reconnects or gaps.

## Error handling

Use documented RootServerException behavior for intentional client-facing
errors. Keep internal stack traces and secrets out of public messages.

Distinguish validation, authorization, transient failure, and unknown-outcome
cases. Make retry behavior appropriate to each operation.

## Verification

Regenerate bindings and run relevant type/build checks.

For material behavior changes, verify unauthorized callers, malformed
requests, response size, broadcast audiences, and reconnect handling.
Report checks actually performed and remaining limitations.
