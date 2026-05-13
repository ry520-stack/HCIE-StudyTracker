/*
  Warnings:

  - You are about to drop the column `date` on the `FocusSession` table. All the data in the column will be lost.
  - You are about to drop the column `failed` on the `FocusSession` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FocusSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL DEFAULT 2700,
    "elapsed" INTEGER NOT NULL DEFAULT 0,
    "switched" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FocusSession" ("duration", "elapsed", "id", "switched", "userId") SELECT "duration", "elapsed", "id", "switched", "userId" FROM "FocusSession";
DROP TABLE "FocusSession";
ALTER TABLE "new_FocusSession" RENAME TO "FocusSession";
CREATE INDEX "FocusSession_userId_idx" ON "FocusSession"("userId");
CREATE INDEX "FocusSession_startedAt_idx" ON "FocusSession"("startedAt");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SHORT_TERM',
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completed", "createdAt", "description", "dueDate", "id", "title", "updatedAt", "userId") SELECT "completed", "createdAt", "description", "dueDate", "id", "title", "updatedAt", "userId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_userId_idx" ON "Task"("userId");
CREATE INDEX "Task_type_idx" ON "Task"("type");
CREATE INDEX "Task_completed_idx" ON "Task"("completed");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
