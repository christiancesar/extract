-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date_published" DATETIME NOT NULL,
    "research_academic" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "search_string" TEXT NOT NULL,
    "errors" TEXT
);
