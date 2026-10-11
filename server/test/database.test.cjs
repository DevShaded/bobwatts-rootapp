const assert = require("node:assert/strict");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, relative } = require("node:path");
const { test } = require("node:test");
const { openDatabase } = require("../dist/database");
const { PrismaClient } = require("../generated/prisma");

test("uses the supplied Root database and preserves its data after reconnecting", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bobwatts-database-"));
  const filename = join(directory, "root data.sqlite3");
  let database;
  try {
    // Seed platform data before the first application migration.
    database = new PrismaClient({ datasourceUrl: `file:${filename}` });
    await database.$executeRawUnsafe("CREATE TABLE __rootapp_fixture (value TEXT NOT NULL)");
    await database.$executeRaw`INSERT INTO __rootapp_fixture (value) VALUES (${"retained"})`;
    await database.$disconnect();
    database = await openDatabase(relative(process.cwd(), filename));
    const databases = await database.$queryRaw`PRAGMA database_list`;
    assert.equal(databases.find((entry) => entry.name === "main").file, filename);
    await database.$disconnect();

    database = await openDatabase(filename);
    assert.deepEqual(await database.$queryRaw`SELECT value FROM __rootapp_fixture`, [
      { value: "retained" },
    ]);
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
