-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "author" TEXT,
    "link" TEXT NOT NULL,
    "link_pdf" TEXT,
    "duplicated" BOOLEAN NOT NULL DEFAULT false,
    "extension" TEXT,
    "exclusion" BOOLEAN NOT NULL DEFAULT false,
    "exclusion_reason" TEXT,
    "description" TEXT,
    "date_published" DATETIME,
    "source" TEXT,
    "search_string" TEXT,
    "content" TEXT,
    "errors" TEXT,
    "analytical_extraction_done" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Article" ("author", "content", "date_published", "description", "duplicated", "errors", "exclusion", "exclusion_reason", "extension", "id", "link", "link_pdf", "search_string", "source", "title") SELECT "author", "content", "date_published", "description", "duplicated", "errors", "exclusion", "exclusion_reason", "extension", "id", "link", "link_pdf", "search_string", "source", "title" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
