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
    "analytical_extraction_done" BOOLEAN NOT NULL DEFAULT false,
    "keywords" TEXT,
    "citation" TEXT,
    "RQ1_ANSWER" TEXT,
    "RQ2_ANSWER" TEXT,
    "RQ3_ANSWER" TEXT,
    "RQ4_ANSWER" TEXT,
    "RQ5_ANSWER" TEXT,
    "IC1_ANSWER" TEXT,
    "IC1_VALIDATION" BOOLEAN NOT NULL DEFAULT false,
    "IC2_ANSWER" TEXT,
    "IC2_VALIDATION" BOOLEAN NOT NULL DEFAULT false,
    "IC3_ANSWER" TEXT,
    "IC3_VALIDATION" BOOLEAN NOT NULL DEFAULT false,
    "EC1_ANSWER" TEXT,
    "EC1_VALIDATION" BOOLEAN NOT NULL DEFAULT false,
    "EC2_ANSWER" TEXT,
    "EC2_VALIDATION" BOOLEAN NOT NULL DEFAULT false,
    "EC3_ANSWER" TEXT,
    "EC3_VALIDATION" BOOLEAN NOT NULL DEFAULT false,
    "EC4_ANSWER" TEXT,
    "EC4_VALIDATION" BOOLEAN NOT NULL DEFAULT false,
    "EC5_ANSWER" TEXT,
    "EC5_VALIDATION" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Article" ("analytical_extraction_done", "author", "content", "date_published", "description", "duplicated", "errors", "exclusion", "exclusion_reason", "extension", "id", "link", "link_pdf", "search_string", "source", "title") SELECT "analytical_extraction_done", "author", "content", "date_published", "description", "duplicated", "errors", "exclusion", "exclusion_reason", "extension", "id", "link", "link_pdf", "search_string", "source", "title" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
