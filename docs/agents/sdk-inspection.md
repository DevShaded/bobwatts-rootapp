# Inspecting installed SDK behavior

Start with declarations for the relevant symbol:

```bash
rg -n -C 4 'restart' node_modules/@rootsdk/client-app/dist/types/index.d.ts
```

When declarations cannot answer a runtime question, inspect the implementation
with bounded character context. Run from the repository root:

```bash
node scripts/inspect-sdk.cjs node_modules/@rootsdk/client-app/dist/cjs/index.js 'restart('
```

The helper searches a literal string, prints at most five matches with 160
characters of context on each side, and escapes embedded control characters.
Its optional third argument resumes from a JavaScript string offset reported
when more matches remain. Exit codes: 0 for matches, 1 for no matches, 2 for
invalid arguments or unreadable files.

Use one relevant package and symbol at a time. For ordinary source and Markdown,
select sections with `rg -n` and read bounded line ranges; split large document
reads when their combined output would truncate. Line-count limits alone cannot
bound minified bundle output.
