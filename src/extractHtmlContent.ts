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

export async function extractHtmlContent() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Habilite apenas se precisar depurar
    defaultViewport: null,
    // args: [
    //   "--no-sandbox",
    //   "--disable-setuid-sandbox",
    //   "--ignore-certificate-errors",
    //   "--ignore-certificate-errors-spki-list",
    //   "--disable-web-security",
    //   "--allow-running-insecure-content",
    // ],
    browser: "chrome",
    // extraPrefsFirefox: {
    //   "browser.download.dir": downloadDir,
    //   "browser.download.folderList": 2,
    //   "browser.download.manager.showWhenStarting": true,
    //   "browser.helperApps.neverAsk.saveToDisk": "application/pdf",
    //   "pdfjs.disabled": true,
    //   "security.enterprise_roots.enabled": true, // Permitir certificados autossinados
    //   "network.stricttransportsecurity.preloadlist": false, // Ignorar HSTS
    //   "browser.ssl_override_behavior": 2, // Aceitar certificados automaticamente
    //   "network.http.speculative-parallel-limit": 0, // Reduz comportamento de rede paralelo
    // },
  });

  const articles = await prisma.article.findMany({
    where: {
      extension: "HTML",
      AND: {
        content: null,
      },
      NOT: [
        // {
        //   link_pdf: {
        //     startsWith: "https://repositorio.maua.br/",
        //   },
        // },
        // {
        //   link_pdf: {
        //     startsWith: "https://www.researchgate.net/",
        //   },
        // },
        // {
        //   link_pdf: {
        //     startsWith: "https://www.academia.edu/",
        //   },
        // },

        {
          link: {
            in: [
              "https://rsdjournal.org/index.php/rsd/article/download/39178/32294/423741",
              "https://ojs.brazilianjournals.com.br/ojs/index.php/BRJD/article/download/50275/pdf/125523",
              "https://old.endeavor.org.br/sobre-a-endeavor/scale-up-endeavor-conheca-as-empresas-aceleradas-no-segundo-batch-nacional-de-2020/",
              "https://repositorio.enap.gov.br/bitstream/1/4890/7/Dados%20abertos%20-%20Propostas%20submetidas%20-%20Desafios%20Covid-19%20.xlsx",
              "https://admissao.sig.guardiaodigital.com.br/processos/anexos-pub/baixar/10746",
              "https://bd.camara.leg.br/bd/bitstream/handle/bdcamara/14826/politica_residuos_solidos_3ed.pdf?sequence=15",
              "https://www.bnb.gov.br/revista/index.php/ren/article/download/1329/880",
              "https://seer.faccat.br/index.php/coloquio/article/view/2206/1357",
              "https://seer.faccat.br/index.php/coloquio/article/view/2206/1357",
              "https://www.revistas.unijui.edu.br/index.php/desenvolvimentoemquestao/article/view/8216/6175",
              "https://www.bnb.gov.br/revista/index.php/ren/article/download/1329/880",
              "https://www.revistas.unijui.edu.br/index.php/desenvolvimentoemquestao/article/view/10937/6722",
              "https://rcgs.uvanet.br/index.php/RCGS/article/download/785/601/",
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
    console.log(`total de artigos: ${articles.length--}`);
    try {
      if (article.link) {
        console.log(`Acessando a URL ${article.link}`);
        await page.goto(article.link, {
          waitUntil: ["load", "domcontentloaded"],
        });

        await wait(5);
        const content = await page.content();
        await prisma.article.update({
          where: {
            id: article.id,
          },
          data: {
            content: content,
          },
        });
      }
    } catch (error: any) {
      console.log("Erro ao acessar a URL:", error);

      await prisma.article.update({
        where: {
          id: article.id,
        },
        data: {
          errors: error.message,
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
