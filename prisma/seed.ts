import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type ArticleJson = {
  title: string;
  author: string;
  link: string;
  link_pdf?: string | null;
  duplicated: string;
  extension: string;
  exclusion: string;
  exclusion_reason?: string | null;
  source: string;
  search_string: string;
};

async function main() {
  const articles = fs.readFileSync(
    path.resolve(__dirname, "articles.json"),
    "utf-8"
  );
  const parsedArticles = JSON.parse(articles) as ArticleJson[];

  await prisma.article.createMany({
    data: parsedArticles.map((article) => {
      return {
        title: article.title,
        author: article.author,
        link: article.link,
        link_pdf: article.link_pdf,
        duplicated: Boolean(article.duplicated),
        extension: article.extension,
        exclusion: Boolean(article.exclusion),
        exclusion_reason: article.exclusion_reason,
        source: article.source,
        search_string: article.search_string,
      };
    }),
  });
}

main()
  .then(() => console.log("Seed data created successfully!"))
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
