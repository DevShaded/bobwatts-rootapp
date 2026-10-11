import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "../generated/prisma";

export async function openDatabase(filename: string): Promise<PrismaClient> {
  // Root supplies the backed-up database path only at runtime. Resolve relative paths
  // here so Prisma does not interpret them relative to the generated client.
  const database = new PrismaClient({
    datasourceUrl: `file:${resolve(filename)}`,
  });

  try {
    await database.$connect();
    await migrate(database);
    return database;
  } catch (error) {
    await database.$disconnect();
    throw error;
  }
}

async function migrate(database: PrismaClient): Promise<void> {
  const version = "20261011140129_welcome_configuration";
  const sql = await readFile(resolve(__dirname, "../prisma/migrations", version, "migration.sql"), "utf8");
  // Apply only our application DDL. Prisma's development schema reconciliation
  // would treat Root-owned tables as drift; it must never run on Root's database.
  await database.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "__bobwatts_migrations" (version TEXT PRIMARY KEY NOT NULL)');
    const applied = await transaction.$queryRaw<{ version: string }[]>`SELECT version FROM __bobwatts_migrations WHERE version = ${version}`;
    if (applied.length > 0) return;
    // The first application migration contains a single CREATE TABLE statement.
    await transaction.$executeRawUnsafe(sql);
    await transaction.$executeRaw`INSERT INTO __bobwatts_migrations (version) VALUES (${version})`;
  });
}
