const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, relative } = require("node:path");
const { test } = require("node:test");
const { openDatabase } = require("../dist/database");

test("uses the supplied Root database and preserves its data after reconnecting", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bobwatts-database-"));
  const filename = join(directory, "root data.sqlite3");
  let database;
  try {
    database = await openDatabase(relative(process.cwd(), filename));
    await database.$executeRawUnsafe("CREATE TABLE __rootapp_fixture (value TEXT NOT NULL)");
    await database.$executeRaw`INSERT INTO __rootapp_fixture (value) VALUES (${"retained"})`;
    const databases = await database.$queryRaw`PRAGMA database_list`;
    assert.equal(databases.find((entry) => entry.name === "main").file, filename);
    await database.$disconnect();

    database = await openDatabase(filename);
    assert.deepEqual(await database.$queryRaw`SELECT value FROM __rootapp_fixture`, [
      { value: "retained" },
    ]);
  } finally {
    await database?.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});
