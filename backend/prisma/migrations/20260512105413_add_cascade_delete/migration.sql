-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReviewRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stage" INTEGER NOT NULL,
    "noteId" TEXT NOT NULL,
    CONSTRAINT "ReviewRecord_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReviewRecord" ("id", "noteId", "reviewedAt", "stage") SELECT "id", "noteId", "reviewedAt", "stage" FROM "ReviewRecord";
DROP TABLE "ReviewRecord";
ALTER TABLE "new_ReviewRecord" RENAME TO "ReviewRecord";
CREATE INDEX "ReviewRecord_noteId_idx" ON "ReviewRecord"("noteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "Note_nextReviewAt_idx" ON "Note"("nextReviewAt");
