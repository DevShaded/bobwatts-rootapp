---
name: root-app-moderation
description: Build or review moderation and audit features for Root Apps. Use for kicks, bans, message deletion, voice moderation, access restrictions, automod rules, moderation cases, and event-based activity histories.
---

# Root App Moderation

## Scope

Provide guidance unless implementation is requested. Do not execute live
moderation actions while developing or reviewing code without authorization.

## Official references

- https://docs.rootapp.com/docs/app-docs/develop/server/community-api/moderation/
- https://docs.rootapp.com/docs/app-docs/develop/server/community-api/messaging/
- https://docs.rootapp.com/docs/app-api-reference/server/
- https://docs.rootapp.com/docs/app-docs/develop/server/community-log/

Verify each action, permission, restriction, and event payload before coding.

## Capability boundaries

Root documents kicks, bans with optional expiration, unbans, message deletion,
voice moderation, and channel access rules.

Do not assume Discord timeouts, slash commands, audit APIs, or role hierarchy
rules have identical Root equivalents.

Distinguish Root's community audit log from the App diagnostic log and your
own database of moderation cases.

## Action workflow

1. Identify the authenticated actor and target.
2. Verify the actor's authorization and the App's required permissions.
3. Validate the reason, duration, and target restrictions.
4. Execute the action and record its outcome.
5. Update authorized clients and any configured log destination.
6. Reconcile ambiguous failures before retrying destructive mutations.

Keep records of requested, successful, failed, and uncertain outcomes distinct.
Never claim an action succeeded merely because it was requested.

For UI actions, make the target and consequence clear before confirmation.

## Audit accuracy

- Message-deletion events omit deleted content and the deleting actor.
- Edit events provide updated content; before/after comparisons require
  an earlier saved version.
- Ban records expose an agent identifier, but do not assume every event
  includes equivalent attribution.
- Record the initiating member separately for actions performed through
  the App.
- Leave unknown actors unknown; do not infer them from timing alone.
- Distinguish source timestamps from the time the App observed an event.
- Do not promise complete historical coverage or replay without a
  documented mechanism.

## Automod engineering

Separate detection rules from enforcement.

Support configurable scope, exemptions, thresholds, and cooldowns. Prevent
self-triggering loops. Prefer an observation mode when introducing new rules.

Limit retained message content to the feature's needs and configured
retention policy. Restrict access to sensitive case details.

## Verification

Check unauthorized requests, protected targets, unavailable permissions,
duplicate events, partial failures, and false positives.

Use a test community for actual moderation checks. Report coverage and
known attribution limits.
