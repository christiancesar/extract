import { PrismaClient } from "@prisma/client";
import { openAi } from "./openai";
import progress from "cli-progress";

type SaveProgress = {
  articleId: string;
  success: boolean;
  error?: string;
};

const prisma = new PrismaClient();

export async function analyticalExtraction() {
  const articles = await prisma.article.findMany({
    where: {
      content: {
        not: null,
      },
      AND: [
        {
          duplicated: false,
          extension: {
            not: "BOOK",
          },
          analytical_extraction_done: false,
        },
      ],
    },
  });

  console.log(`Total de artigos a processar: ${articles.length}`);
  const bar = new progress.SingleBar(
    {
      format: "[{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total}",
      etaBuffer: 100,
      fps: 5,
    },
    progress.Presets.shades_classic
  );
  bar.start(articles.length, 0);

  if (articles.length > 0) {
    for (const [index, article] of articles.entries()) {
      try {
        const result = await openAi({
          articleId: article.id,
          raw: article.content!,
        });

        // Atualizar o status do artigo no banco de dados
        saveProgress({ articleId: article.id, success: result.isRight() });

        bar.update(index + 1, {
          message: `Artigo ${index + 1}/${articles.length}`,
        });
      } catch (error: any) {
        console.error(
          `\nErro ao processar o artigo ${article.id}: ${error.message}`
        );

        saveProgress({
          articleId: article.id,
          success: false,
          error: error.message,
        });
      }
    }
    bar.stop();
    console.log("\nProcessamento concluído.");
  } else {
    console.log("\nNenhum artigo para processar.");
  }
}

async function saveProgress({ articleId, success, error }: SaveProgress) {
  await prisma.article.update({
    where: {
      id: articleId,
    },
    data: {
      analytical_extraction_done: success ? true : false,
      errors: error ? error : null,
    },
  });
}
