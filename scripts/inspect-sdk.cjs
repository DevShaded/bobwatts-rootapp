const { readFileSync } = require("node:fs");

const [filename, query, offset = "0", ...extra] = process.argv.slice(2);
const startOffset = Number(offset);
if (!filename || !query || query.length > 160 || extra.length > 0 ||
    !/^\d+$/.test(offset) || !Number.isSafeInteger(startOffset)) {
  console.error("Usage: node scripts/inspect-sdk.cjs <file> <literal, 1–160 characters> [start-offset]");
  process.exit(2);
}

try {
  const source = readFileSync(filename, "utf8");
  const context = 160;
  const limit = 5;
  let cursor = startOffset;
  let count = 0;
  let match = source.indexOf(query, cursor);

  while (match !== -1 && count < limit) {
    const start = Math.max(0, match - context);
    const end = Math.min(source.length, match + query.length + context);
    const before = source.slice(0, match);
    const line = before.split("\n").length;
    const column = match - before.lastIndexOf("\n");
    console.log(`${filename}:${line}:${column} (offset ${match})`);
    // Minified bundles can occupy one enormous line; bound characters, not lines.
    // JSON quoting also keeps newlines and terminal control characters visible.
    console.log(JSON.stringify(source.slice(start, end)));
    count++;
    cursor = match + query.length;
    match = source.indexOf(query, cursor);
  }

  if (count === 0) {
    console.log("No matches at or after the requested offset.");
    process.exitCode = 1;
  } else if (match !== -1) {
    console.log(`More matches remain. Repeat with start-offset ${cursor}. Offsets use JavaScript string indices.`);
  }
} catch (error) {
  console.error(`Cannot inspect file: ${error.message}`);
  process.exitCode = 2;
}
