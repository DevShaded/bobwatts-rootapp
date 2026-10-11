const { utimesSync } = require("node:fs");

// DevHost watches only the entry point, so notify it after any successful server build.
const now = new Date();
utimesSync("dist/main.js", now, now);
