-- CreateTable
CREATE TABLE "bobwatts_welcome_configuration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "destinationId" TEXT,
    "greeting" TEXT NOT NULL DEFAULT 'Welcome {user}! Glad you’re here.'
);
