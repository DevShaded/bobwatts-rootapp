---
name: keep-code-simple
description: Keep code simple and avoid overengineering when writing, modifying, or refactoring code. Favor clear control flow, existing patterns, and the smallest complete design that meets the current requirements.
---

# Keep code simple

Choose the simplest complete solution that fits the existing architecture and is easy for a developer to understand and maintain.

- Before editing, trace the relevant behavior and requirements. Reuse behavior that already exists; extend the layer that owns it when a change is needed.
- Prefer straightforward control flow, clear names, and cohesive functions. Optimize readability and total system complexity rather than brevity or the number of files changed.
- Reuse suitable project helpers, native platform features, standard libraries, and installed dependencies before introducing a new implementation.
- Introduce an abstraction when it clarifies ownership, removes meaningful duplication, or solves a current requirement. Keep concrete implementations when extra interfaces, wrappers, factories, services, or configuration would add indirection without a present benefit.
- Build for the requested behavior. Add extension points and speculative features only when current requirements justify them.
- Fix the cause at the responsible layer. When existing structure obstructs a clear solution, make the smallest coherent refactor needed rather than layering on workarounds.
- Preserve correctness, trust-boundary validation, authorization, security, error handling, accessibility, compatibility, and data safety. Simplicity must not remove necessary safeguards or required tests.
- Review the change for unnecessary branches, duplication, dependencies, and indirection. Remove what serves no current purpose, then run the smallest sufficient checks for the behavior affected.
- If unavoidable complexity remains, briefly explain the concrete requirement or tradeoff that makes it necessary.

Apply these preferences to the work requested. Broader cleanup of unrelated code requires its own scope.
