---
name: explain-complex-code
description: Add short explanatory comments above advanced or hard-to-understand code when generating or modifying code in files or chat snippets. Use for non-obvious algorithms, dense expressions, advanced language features, concurrency, or subtle business rules.
---

# Explain complex code

Help the user understand generated code without interrupting its readability.

- Prefer clear names and straightforward code first. When necessary complexity remains, add a short comment immediately above the relevant block or expression.
- Explain what the block accomplishes in plain language. Include the reason for a surprising approach or the key assumption when that makes the behavior easier to understand.
- Keep comments to one or two short sentences, usually one or two lines. Explain unfamiliar terms when needed instead of assuming advanced knowledge.
- Focus on code whose behavior is not obvious at a glance: intricate transformations, recursion, bit operations, advanced type constructs, concurrency, or subtle ordering and business rules. Leave straightforward code uncommented.
- Use the language's valid comment syntax and the project's comment style and language. In chat snippets, place the comment inside the code block immediately above the code it explains. For formats without comments, put a short explanation immediately above the snippet in prose; keep saved files valid.
- Keep comments accurate when changing code. Update an existing explanation rather than duplicating it. Limit additions to the code being generated or modified unless the user requests a broader pass.

Example:

```ts
// Keep the last item for each ID, ordered by when each ID first appeared.
const uniqueItems = [...new Map(items.map(item => [item.id, item])).values()];
```
