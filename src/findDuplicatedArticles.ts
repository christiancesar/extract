import { PrismaClient } from "@prisma/client";

export async function findDuplicatedArticles() {
  const prisma = new PrismaClient();

  let articles = await prisma.article.findMany({
    orderBy: {
      link: "asc",
    },
  });

  let articlesVerified = articles.length;

  while (articlesVerified > 0) {
    const article = articles[0];
    const duplicates = articles.filter((a) => a.link === article.link);

    if (duplicates.length > 1) {
      console.warn(
        `\n-> Foram encontrados ${duplicates.length} artigos duplicados`
      );

      for (let i = 1; i < duplicates.length; i++) {
        console.warn(
          `----> Marcando como duplicado artigo: ${duplicates[i].id}`
        );
        await prisma.article.update({
          where: {
            id: duplicates[i].id,
          },
          data: {
            duplicated: true,
            exclusion: true,
            exclusion_reason: "duplicate article",
          },
        });
      }

      // Remove o artigo da lista ja verificados
      articles = articles.filter((a) => !duplicates.includes(a));
      articlesVerified = articles.length;
    }

    if (duplicates.length === 1) {
      console.info(
        `\n<-- Nao há artigos duplicados igual ao link ${article.link} -->`
      );
      articles = articles.filter((a) => a.id !== article.id);
      articlesVerified = articles.length;
    }
  }

  console.log(articles.map((article) => article.link));
}
