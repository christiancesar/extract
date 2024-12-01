import path from "path";
import fs from "fs";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import ts from "typescript";

type ResearchQuestionInstance =
  | ResearchQuestion[]
  | ResearchQuestion
  | ResearchQuestionString
  | RQ[];

type InclusionCriterionInstance =
  | InclusionCriterion[]
  | InclusionCriterion
  | InclusionCriterionString
  | Criterion[];

type ExclusionCriterionInstance =
  | ExclusionCriterion[]
  | ExclusionCriterion
  | ExclusionCriterionString
  | Criterion[];

interface Content {
  title: string;
  authors: string[];
  description: Description;
  date_published: string;
  keywords: string[];
  citation: string;
  article_type: string[];
  research_questions: ResearchQuestionInstance;
  inclusion_criteria: InclusionCriterionInstance;
  exclusion_criteria: ExclusionCriterionInstance;
}

interface ExclusionCriterion {
  [key: string]: Criterion;
}

interface ExclusionCriterionString {
  [key: string]: string;
}

interface InclusionCriterion {
  [key: string]: Criterion;
}

interface InclusionCriterionString {
  [key: string]: string;
}

interface Criterion {
  criteria: string;
  answer: string;
  validation: boolean;
}

interface ResearchQuestion {
  [key: string]: RQ;
}

interface ResearchQuestionString {
  [key: string]: string;
}

interface RQ {
  question: string;
  answer: string;
}

interface Description {
  problema_abordado: string;
  objetivo_do_estudo: string;
  solucao_proposta: string;
  metodologia_aplicada: string;
  resultados_conclusao: string;
}

const repositoriesDir = path.resolve("./src/repositories/");
if (!fs.existsSync(repositoriesDir)) {
  fs.mkdirSync(repositoriesDir);
}

const contentDir = path.resolve("./src/repositories/content");
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir);
}

const prisma = new PrismaClient();

function isArrayOfResearchQuestions(
  value: ResearchQuestionInstance
): value is ResearchQuestion[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        Object.keys(item).length === 1 && // Verifica que cada item tem exatamente uma chave
        ["RQ1", "RQ2", "RQ3", "RQ4", "RQ5"].includes(Object.keys(item)[0]) && // A chave deve ser uma das permitidas
        typeof item[Object.keys(item)[0]] === "object" && // O valor deve ser um objeto
        "question" in item[Object.keys(item)[0]] &&
        "answer" in item[Object.keys(item)[0]] // O valor deve ter `question` e `answer`
    )
  );
}

function isSingleResearchQuestion(
  value: ResearchQuestionInstance
): value is ResearchQuestion {
  return (
    typeof value === "object" && // Verifica se é um objeto
    value !== null && // Garante que não é nulo
    ["RQ1", "RQ2", "RQ3", "RQ4", "RQ5"].every(
      (key) =>
        key in value && // Verifica se a chave existe
        typeof (value as Record<string, unknown>)[key] === "object" && // Verifica se o valor da chave é um objeto
        (value as Record<string, RQ>)[key] !== null && // Garante que não é nulo
        "question" in (value as Record<string, RQ>)[key] && // Verifica a propriedade `question`
        typeof (value as Record<string, RQ>)[key].question === "string" && // Garante que `question` é string
        "answer" in (value as Record<string, RQ>)[key] && // Verifica a propriedade `answer`
        typeof (value as Record<string, RQ>)[key].answer === "string" // Garante que `answer` é string
    )
  );
}

function isArrayOfRQs(value: ResearchQuestionInstance): value is RQ[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" && "question" in item && "answer" in item
    )
  );
}

function isArrayOfInclusionCriteria(
  value: InclusionCriterionInstance
): value is InclusionCriterion[] {
  return (
    Array.isArray(value) && // Verifica se é um array
    value.every(
      (item) =>
        typeof item === "object" && // Cada item deve ser um objeto
        item !== null && // Não pode ser nulo
        Object.entries(item).every(
          ([key, criterion]) =>
            key.startsWith("IC") && // A chave deve começar com "IC"
            typeof criterion === "object" && // O valor deve ser um objeto
            criterion !== null && // Não pode ser nulo
            "criteria" in criterion && // Deve conter a chave "criteria"
            "answer" in criterion && // Deve conter a chave "answer"
            "validation" in criterion && // Deve conter a chave "validation"
            typeof criterion.criteria === "string" && // `criteria` deve ser string
            typeof criterion.answer === "string" && // `answer` deve ser string
            (criterion.validation === true || // `validation` pode ser boolean
              criterion.validation === false || // ou string
              criterion.validation === "true" ||
              criterion.validation === "false")
        )
    )
  );
}

function isSingleInclusionCriterion(
  value: InclusionCriterionInstance
): value is InclusionCriterion {
  return (
    typeof value === "object" && // Verifica se é um objeto
    value !== null && // Não pode ser nulo
    Object.entries(value).every(
      ([key, criterion]) =>
        key.startsWith("IC") && // Chaves devem começar com "IC"
        typeof criterion === "object" && // Cada valor deve ser um objeto
        criterion !== null && // Não pode ser nulo
        "criteria" in criterion && // Deve conter a chave "criteria"
        "answer" in criterion && // Deve conter a chave "answer"
        "validation" in criterion && // Deve conter a chave "validation"
        typeof criterion.criteria === "string" && // `criteria` deve ser string
        typeof criterion.answer === "string" && // `answer` deve ser string
        (criterion.validation === true || // `validation` pode ser booleano
          criterion.validation === false || // ou
          criterion.validation === "true" || // string "true"
          criterion.validation === "false") // string "false"
    )
  );
}

function isArrayOfCriteria(
  value: InclusionCriterionInstance
): value is Criterion[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "criteria" in item &&
        "answer" in item &&
        "validation" in item &&
        typeof item.criteria === "string" &&
        typeof item.answer === "string" &&
        typeof Boolean(item.validation) === "boolean"
    )
  );
}

function isArrayOfExclusionCriteria(
  value: ExclusionCriterionInstance
): value is ExclusionCriterion[] {
  return (
    Array.isArray(value) && // Verifica se é um array
    value.every(
      (item) =>
        typeof item === "object" && // Cada item deve ser um objeto
        item !== null && // Não pode ser nulo
        Object.entries(item).every(
          ([key, criterion]) =>
            key.startsWith("EC") && // A chave deve começar com "EC"
            typeof criterion === "object" && // O valor deve ser um objeto
            criterion !== null && // Não pode ser nulo
            "criteria" in criterion && // Deve conter a chave "criteria"
            "answer" in criterion && // Deve conter a chave "answer"
            "validation" in criterion && // Deve conter a chave "validation"
            typeof criterion.criteria === "string" && // `criteria` deve ser string
            typeof criterion.answer === "string" && // `answer` deve ser string
            (criterion.validation === true || // `validation` pode ser booleano
              criterion.validation === false ||
              criterion.validation === "true" || // ou string "true"/"false"
              criterion.validation === "false")
        )
    )
  );
}

function isSingleExclusionCriterion(
  value: ExclusionCriterionInstance
): value is ExclusionCriterion {
  return (
    typeof value === "object" && // Verifica se é um objeto
    value !== null && // Não pode ser nulo
    Object.entries(value).every(
      ([key, criterion]) =>
        key.startsWith("EC") && // A chave deve começar com "EC"
        typeof criterion === "object" && // Cada valor deve ser um objeto
        criterion !== null && // Não pode ser nulo
        "criteria" in criterion && // Deve conter a chave "criteria"
        "answer" in criterion && // Deve conter a chave "answer"
        "validation" in criterion && // Deve conter a chave "validation"
        typeof criterion.criteria === "string" && // `criteria` deve ser string
        typeof criterion.answer === "string" && // `answer` deve ser string
        (criterion.validation === true || // `validation` pode ser boolean
          criterion.validation === false ||
          criterion.validation === "true" || // ou string "true"/"false"
          criterion.validation === "false")
    )
  );
}

function isArrayOfExclusionCriteriaAsCriterion(
  value: ExclusionCriterionInstance
): value is Criterion[] {
  return (
    Array.isArray(value) && // Verifica se é um array
    value.every(
      (item) =>
        typeof item === "object" && // Cada item deve ser um objeto
        item !== null && // Não pode ser nulo
        "criteria" in item && // Deve conter a chave "criteria"
        "answer" in item && // Deve conter a chave "answer"
        "validation" in item && // Deve conter a chave "validation"
        typeof item.criteria === "string" && // `criteria` deve ser string
        typeof item.answer === "string" && // `answer` deve ser string
        (item.validation === true || // `validation` pode ser booleano
          item.validation === false ||
          item.validation === "true" || // ou string "true"/"false"
          item.validation === "false")
    )
  );
}

export async function exportContentFromJson() {
  let files = fs.readdirSync(repositoriesDir);

  if (files.length === 0) {
    console.log("Nenhum arquivo encontrado para extração.");
    return;
  }

  if (files.length > 0) {
    console.log(`Foram encontrados ${files.length} arquivos para extração.`);
    const batchSize = 100;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      batch.map((file) => {
        try {
          console.log("----------------------------------------");
          console.log("Extraindo conteúdo do arquivo:", file);
          console.log(
            "Restam",
            files.length - i - batch.indexOf(file) - 1,
            "arquivos para extração."
          );
          console.log("----------------------------------------");

          const filePath = path.join(repositoriesDir, file);

          const completionJson = fs.readFileSync(filePath);

          const completion = JSON.parse(
            completionJson.toString()
          ) as OpenAI.Chat.Completions.ChatCompletion & {
            _request_id?: string | null;
          };
          // console.log("Conteúdo extraído do PDF:", pdfRaw.text);
          const openAiResponse = completion.choices[0].message.content;

          // Remover delimitadores de bloco de código (```json e ```)
          const extractedContent = openAiResponse!
            .replace(/```json|```/g, "")
            .trim();

          // Parse o JSON para validar
          const parsedResponse = JSON.parse(extractedContent);

          fs.writeFileSync(
            path.resolve(contentDir, file),
            JSON.stringify(parsedResponse, null, 2)
          );
        } catch (error: any) {
          console.log("Erro ao acessar o arquivo:", error);
        }
      });
      console.log(`Extração finalizada de ${batch.length} arquivos`);
      console.log(batch);
    }
  }
}

export async function saveToDB() {
  let files = fs.readdirSync(contentDir);

  if (files.length === 0) {
    console.log("Nenhum arquivo encontrado para extração.");
    return;
  }

  if (files.length > 0) {
    console.log(`Foram encontrados ${files.length} arquivos para extração.`);
    const batchSize = 100;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (file) => {
          try {
            console.log("----------------------------------------");
            console.log("Extraindo conteúdo do arquivo:", file);
            console.log(
              "Restam",
              files.length - i - batch.indexOf(file) - 1,
              "arquivos para extração."
            );
            console.log("----------------------------------------");

            const filePath = path.join(contentDir, file);

            const contentJson = fs.readFileSync(filePath);

            const content = JSON.parse(contentJson.toString()) as Content;

            const {
              research_questions,
              inclusion_criteria,
              exclusion_criteria,
            } = content;

            let RQ1_ANSWER = "";
            let RQ2_ANSWER = "";
            let RQ3_ANSWER = "";
            let RQ4_ANSWER = "";
            let RQ5_ANSWER = "";

            let IC1_ANSWER = "";
            let IC1_VALIDATION = false;
            let IC2_ANSWER = "";
            let IC2_VALIDATION = false;
            let IC3_ANSWER = "";
            let IC3_VALIDATION = false;

            let EC1_ANSWER = "";
            let EC1_VALIDATION = false;
            let EC2_ANSWER = "";
            let EC2_VALIDATION = false;
            let EC3_ANSWER = "";
            let EC3_VALIDATION = false;
            let EC4_ANSWER = "";
            let EC4_VALIDATION = false;
            let EC5_ANSWER = "";
            let EC5_VALIDATION = false;

            let analytical: boolean = true;
            switch (true) {
              case isArrayOfResearchQuestions(research_questions):
                console.log("É um array de ResearchQuestion");
                RQ1_ANSWER = research_questions[0].RQ1.answer;
                RQ2_ANSWER = research_questions[1].RQ2.answer;
                RQ3_ANSWER = research_questions[2].RQ3.answer;
                RQ4_ANSWER = research_questions[3].RQ4.answer;
                RQ5_ANSWER = research_questions[4].RQ5.answer;
                break;

              case isSingleResearchQuestion(research_questions):
                console.log("É um objeto ResearchQuestion");
                RQ1_ANSWER = research_questions.RQ1.answer;
                RQ2_ANSWER = research_questions.RQ2.answer;
                RQ3_ANSWER = research_questions.RQ3.answer;
                RQ4_ANSWER = research_questions.RQ4.answer;
                RQ5_ANSWER = research_questions.RQ5.answer;
                break;

              case isArrayOfRQs(research_questions):
                console.log("É um array de RQ");
                RQ1_ANSWER = research_questions[0].answer;
                RQ2_ANSWER = research_questions[1].answer;
                RQ3_ANSWER = research_questions[2].answer;
                RQ4_ANSWER = research_questions[3].answer;
                RQ5_ANSWER = research_questions[4].answer;
                break;

              default:
                console.log("Tipo RQ desconhecido ou inválido.");

                analytical = false;
                break;
            }

            switch (true) {
              case isSingleInclusionCriterion(inclusion_criteria):
                console.log("É um único InclusionCriterion");
                IC1_ANSWER = inclusion_criteria.IC1.answer;
                IC1_VALIDATION = Boolean(inclusion_criteria.IC1.validation);
                IC2_ANSWER = inclusion_criteria.IC2.answer;
                IC2_VALIDATION = Boolean(inclusion_criteria.IC2.validation);
                IC3_ANSWER = inclusion_criteria.IC3.answer;
                IC3_VALIDATION = Boolean(inclusion_criteria.IC3.validation);
                break;

              case isArrayOfInclusionCriteria(inclusion_criteria):
                console.log("É um array de InclusionCriteria");
                // console.log(inclusion_criteria);
                IC1_ANSWER = inclusion_criteria[0].IC1.answer;
                IC1_VALIDATION = Boolean(inclusion_criteria[0].IC1.validation);
                IC2_ANSWER = inclusion_criteria[1].IC2.answer;
                IC2_VALIDATION = Boolean(inclusion_criteria[1].IC2.validation);
                IC3_ANSWER = inclusion_criteria[2].IC3.answer;
                IC3_VALIDATION = Boolean(inclusion_criteria[2].IC3.validation);
                break;

              case isArrayOfCriteria(inclusion_criteria):
                console.log("É um array de Criterion");
                IC1_ANSWER = inclusion_criteria[0].answer;
                IC1_VALIDATION = Boolean(inclusion_criteria[0].validation);
                IC2_ANSWER = inclusion_criteria[1].answer;
                IC2_VALIDATION = Boolean(inclusion_criteria[1].validation);
                IC3_ANSWER = inclusion_criteria[2].answer;
                IC3_VALIDATION = Boolean(inclusion_criteria[2].validation);
                break;

              default:
                console.log("Tipo IE desconhecido ou inválido.");

                analytical = false;
                break;
            }

            switch (true) {
              case isSingleExclusionCriterion(exclusion_criteria):
                console.log("É um Objeto de ExclusionCriterion");
                EC1_ANSWER = exclusion_criteria.EC1.answer;
                EC1_VALIDATION = Boolean(exclusion_criteria.EC1.validation);
                EC2_ANSWER = exclusion_criteria.EC2.answer;
                EC2_VALIDATION = Boolean(exclusion_criteria.EC2.validation);
                EC3_ANSWER = exclusion_criteria.EC3.answer;
                EC3_VALIDATION = Boolean(exclusion_criteria.EC3.validation);
                EC4_ANSWER = exclusion_criteria.EC4.answer;
                EC4_VALIDATION = Boolean(exclusion_criteria.EC4.validation);
                EC5_ANSWER = exclusion_criteria.EC5.answer;
                EC5_VALIDATION = Boolean(exclusion_criteria.EC5.validation);
                break;

              case isArrayOfExclusionCriteria(exclusion_criteria):
                console.log("É um array de ExclusionCriteria");
                EC1_ANSWER = exclusion_criteria[0].EC1.answer;
                EC1_VALIDATION = Boolean(exclusion_criteria[0].EC1.validation);
                EC2_ANSWER = exclusion_criteria[1].EC2.answer;
                EC2_VALIDATION = Boolean(exclusion_criteria[1].EC2.validation);
                EC3_ANSWER = exclusion_criteria[2].EC3.answer;
                EC3_VALIDATION = Boolean(exclusion_criteria[2].EC3.validation);
                EC4_ANSWER = exclusion_criteria[3].EC4.answer;
                EC4_VALIDATION = Boolean(exclusion_criteria[3].EC4.validation);
                EC5_ANSWER = exclusion_criteria[4].EC5.answer;
                EC5_VALIDATION = Boolean(exclusion_criteria[4].EC5.validation);
                break;

              case isArrayOfExclusionCriteriaAsCriterion(exclusion_criteria):
                console.log("É um array de Criterion");
                EC1_ANSWER = exclusion_criteria[0].answer;
                EC1_VALIDATION = Boolean(exclusion_criteria[0].validation);
                EC2_ANSWER = exclusion_criteria[1].answer;
                EC2_VALIDATION = Boolean(exclusion_criteria[1].validation);
                EC3_ANSWER = exclusion_criteria[2].answer;
                EC3_VALIDATION = Boolean(exclusion_criteria[2].validation);
                EC4_ANSWER = exclusion_criteria[3].answer;
                EC4_VALIDATION = Boolean(exclusion_criteria[3].validation);
                EC5_ANSWER = exclusion_criteria[4].answer;
                EC5_VALIDATION = Boolean(exclusion_criteria[4].validation);
                break;

              default:
                console.log("Tipo EC desconhecido ou inválido.");

                analytical = false;
                break;
            }

            await prisma.article.update({
              where: {
                id: file.replace(".json", ""),
              },
              data: {
                title: content.title,
                author: content.authors
                  .reduce((acc, author) => acc + author + ", ", "")
                  .slice(0, -2),
                description: JSON.stringify(content.description),
                keywords: content.keywords
                  .reduce((acc, keyword) => acc + keyword + ", ", "")
                  .slice(0, -2),
                citation: content.citation,
                date_published: content.date_published,
                RQ1_ANSWER,
                RQ2_ANSWER,
                RQ3_ANSWER,
                RQ4_ANSWER,
                RQ5_ANSWER,
                IC1_ANSWER,
                IC1_VALIDATION,
                IC2_ANSWER,
                IC2_VALIDATION,
                IC3_ANSWER,
                IC3_VALIDATION,
                EC2_ANSWER,
                EC2_VALIDATION,
                EC3_ANSWER,
                EC3_VALIDATION,
                EC4_ANSWER,
                EC4_VALIDATION,
                EC5_ANSWER,
                EC5_VALIDATION,
                analytical_extraction_done: !(RQ1_ANSWER.trim() !== ""),
              },
            });
          } catch (error: any) {
            console.log("Erro ao acessar o arquivo:", error);
          }
        })
      );
      // console.log(`Extração finalizada de ${batch.length} arquivos`);
      // console.log(batch);
    }
  }
}
