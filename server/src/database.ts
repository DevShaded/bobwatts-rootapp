import { resolve } from "node:path";
import { PrismaClient } from "../generated/prisma";

export async function openDatabase(filename: string): Promise<PrismaClient> {
  // Root supplies the backed-up database path only at runtime. Resolve relative paths
  // here so Prisma does not interpret them relative to the generated client.
  const database = new PrismaClient({
    datasourceUrl: `file:${resolve(filename)}`,
  });

  await database.$connect();
  return database;
}
