import { PrismaClient } from "@prisma/client";
import { error } from "console";
import { randomUUID } from "crypto";
import "dotenv/config";
import fs from "fs";
import path from "path";
import PdfParse from "pdf-parse";
import puppeteer, { Page } from "puppeteer";

const prisma = new PrismaClient();

// Diretório de download
const downloadDir = path.resolve("./src/download/");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

export async function extractPdfPage() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Habilite apenas se precisar depurar
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      "--disable-web-security",
      "--allow-running-insecure-content",
    ],
    browser: "firefox",
    extraPrefsFirefox: {
      "browser.download.dir": downloadDir,
      "browser.download.folderList": 2,
      "browser.download.manager.showWhenStarting": true,
      "browser.helperApps.neverAsk.saveToDisk": "application/pdf",
      "pdfjs.disabled": true,
      "security.enterprise_roots.enabled": true, // Permitir certificados autossinados
      "network.stricttransportsecurity.preloadlist": false, // Ignorar HSTS
      "browser.ssl_override_behavior": 2, // Aceitar certificados automaticamente
      "network.http.speculative-parallel-limit": 0, // Reduz comportamento de rede paralelo
    },
  });

  const articles = await prisma.article.findMany({
    where: {
      extension: "PDF",
      AND: {
        content: null,
      },
      NOT: [
        {
          link_pdf: {
            startsWith: "https://repositorio.maua.br/",
          },
        },
        {
          link_pdf: {
            startsWith: "https://www.researchgate.net/",
          },
        },
        {
          link_pdf: {
            startsWith: "https://www.academia.edu/",
          },
        },

        {
          link_pdf: {
            in: [
              "https://repositorio.ifes.edu.br/bitstream/handle/123456789/2614/TCF_OLIVEIRA.pdf?sequence=1&isAllowed=y",
              "https://repositorio.unip.br/wp-content/uploads/tainacan-items/198/86975/RODRIGO-RODRIGUES.pdf",
              "https://dspace.mackenzie.br/bitstreams/31504cfd-b2cc-44c8-b9ef-143357136a5d/download",
              "https://editorarevistas.mackenzie.br/index.php/rmec/article/view/6458/5103",
              "https://core.ac.uk/download/pdf/16037203.pdf",
              "https://revistas.ung.br/index.php/3setor/article/view/512/606",
              "https://www2.unifap.br/glauberpereira/files/2016/07/Log%C3%ADstica-Reversa-e-Sustentabilidade.pdf",
              "https://www.fcgov.com/business/files/23-25964-circular-economy-workplan-design-interactive.pdf",
            ],
          },
        },
      ],
    },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(0);
  // page.setBypassServiceWorker(false);

  for (let article of articles) {
    console.log(`total de artigos: ${articles.length}`);
    console.log(`total de artigos: ${articles.length--}`);
    try {
      if (article.link_pdf) {
        console.log(`Acessando a URL ${article.link_pdf}`);

        page.goto(article.link_pdf);

        await wait(10);
        let downloaded = false;
        for (let i = 0; i < 5; i++) {
          console.log("analisando se fez o download do pdf automaticamente", i);
          await wait(2);

          downloaded = fileExist();
          if (downloaded) {
            console.log("PDF fez download automatico");
            break;
          }
        }

        if (!downloaded) {
          console.log("PDF nao fez download automatico, tentando manualmente");
          await page.evaluate(() => {
            console.log(document.querySelector("#toolbarViewerRight"));
          });
          await wait(15);
          downloaded = fileExist();
        }

        if (!downloaded) {
          console.log(
            "Foram tentadas todas as formas de download, PDF não encontrado"
          );
          await prisma.article.update({
            where: {
              id: article.id,
            },
            data: {
              errors: "Erro ao acessar a URL",
              exclusion: true,
              exclusion_reason: "Erro ao acessar a URL",
            },
          });
        }

        if (downloaded) {
          const { error, content } = await extractContentForPdfAndDelete();

          await prisma.article.update({
            where: {
              id: article.id,
            },
            data: {
              content: content,
              errors: error ? "Erro ao extrair conteúdo do PDF" : null,
            },
          });
        }
      }
    } catch (errorExt: any) {
      console.log("Erro ao acessar a URL:", errorExt);

      const { error, content } = await extractContentForPdfAndDelete();
      await prisma.article.update({
        where: {
          id: article.id,
        },
        data: {
          errors: error ? errorExt : null,
          content: content,
          exclusion: true,
          exclusion_reason: "Erro ao acessar a URL",
        },
      });
    }
  }
}

function wait(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function fileExist(): boolean {
  // Localiza o arquivo PDF na pasta de download
  const file = fs
    .readdirSync(downloadDir)
    .find((file) => file.endsWith(".pdf"));

  if (!file) {
    return false;
  }
  return true;
}

async function extractContentForPdfAndDelete(): Promise<{
  error: boolean;
  content: string;
}> {
  // Localiza o arquivo PDF na pasta de download
  const file = fs
    .readdirSync(downloadDir)
    .find((file) => file.endsWith(".pdf"));

  if (!file) {
    return { error: true, content: "Nenhum arquivo PDF encontrado." };
  }

  const filePath = path.join(downloadDir, file);

  // Lê o conteúdo do arquivo PDF
  const dataBuffer = fs.readFileSync(filePath);
  const pdfRaw = await PdfParse(dataBuffer);

  // Exibe o conteúdo extraído
  // console.log("Conteúdo extraído do PDF:", pdfRaw.text);

  // Deleta o arquivo PDF após a extração
  deleteFilesInFolder();
  // Retorna o conteúdo extraído, se necessário
  return { error: false, content: pdfRaw.text };
}

function deleteFilesInFolder() {
  fs.readdir(downloadDir, (err, files) => {
    if (err) {
      return console.error("Erro ao listar arquivos:", err);
    }

    files.forEach((file) => {
      const filePath = path.join(downloadDir, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          return console.error("Erro ao verificar arquivo:", err);
        }

        if (stats.isFile()) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Erro ao deletar arquivo:", err);
            } else {
              console.log(`Arquivo deletado: ${filePath}`);
            }
          });
        }
      });
    });
  });
}
