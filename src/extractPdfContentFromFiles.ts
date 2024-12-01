import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import fs from "fs";
import path from "path";
import PdfParse from "pdf-parse";

const prisma = new PrismaClient();

const downloadDir = path.resolve("./src/download/");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

export async function extractPdfContentFromFiles() {
  const files = fs.readdirSync(downloadDir);

  if (files.length === 0) {
    console.log("Nenhum arquivo encontrado para extração.");
    return;
  }

  if (files.length > 0) {
    console.log(`Foram encontrados ${files.length} arquivos para extração.`);
    let processedFiles = 1;
    for (const [index, file] of files) {
      processedFiles++;
      try {
        console.log("----------------------------------------");
        console.log("Extraindo conteúdo do arquivo:", file);
        console.log(
          "Restam",
          files.length - processedFiles,
          "arquivos para extração."
        );
        console.log("----------------------------------------");

        const filePath = path.join(downloadDir, file);

        // Lê o conteúdo do arquivo PDF
        const dataBuffer = fs.readFileSync(filePath);
        const pdfRaw = await PdfParse(dataBuffer);

        // console.log("Conteúdo extraído do PDF:", pdfRaw.text);
        const uuid = file.replace(/\.pdf$/i, "");
        await prisma.article.update({
          where: {
            id: uuid,
          },
          data: {
            content: pdfRaw.text,
          },
        });
      } catch (error: any) {
        console.log("Erro ao acessar o arquivo:", error);
      }
    }

    console.log("Extração finalizada dos arquivos");
    console.log(files);
  }

  // console.log("Extração finalizada dos arquivos");
  // console.log(files.map((file) => file.replace(/\.pdf$/i, "")));
}
