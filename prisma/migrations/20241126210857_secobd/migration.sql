-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "link" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "date_published" DATETIME,
    "research_academic" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "search_string" TEXT,
    "errors" TEXT,
    "content" TEXT
);
INSERT INTO "new_Article" ("author", "date_published", "description", "errors", "id", "link", "research_academic", "search_string", "source", "title") SELECT "author", "date_published", "description", "errors", "id", "link", "research_academic", "search_string", "source", "title" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
