import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";
import path from "path";
import { Either, left, right } from "./Either";
import { encoding_for_model } from "tiktoken";

const repositoryDir = path.resolve(__dirname, "repositories");

if (!fs.existsSync(repositoryDir)) {
  fs.mkdirSync(repositoryDir, { recursive: true });
}

type OpenAiRequest = {
  articleId: string;
  raw: string;
};

class OpenAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Error";
  }
}

class OpenAiSuccess {
  constructor() {}
}

type OpenAiResponse = Either<OpenAiError, OpenAiSuccess>;

export async function openAi({
  articleId,
  raw,
}: OpenAiRequest): Promise<OpenAiResponse> {
  const openai = new OpenAI({ apiKey: process.env["OPEN_AI_API_KEY"] });
  const model = "gpt-4o-mini";
  let content = `
          1. title: Extraia o título do texto.
          2. authors: Liste os autores mencionados, no formato de um array ["autor 1", "autor 2"].
          3. description: Crie um resumo detalhado contendo:
            - Problema abordado
            - Objetivo do estudo
            - Solução proposta
            - Metodologia aplicada
            - Resultados/conclusão
          4. date_published: Identifique a data de publicação ou última atualização, formatada no padrão brasileiro "dia/mês/ano".
          5. keywords: Extraia palavras-chave relevantes para o texto.
          6. citation: Crie uma citação no formato ABNT para o texto.
          7. article_type: Identifique o tipo de artigo caso for Academico "academic article" se não "blog"] ).

          As perguntas de pesquisa (RQs), critérios de inclusão (IC) e critérios de exclusão (EC), tem como intuito
          verificar a relevância do estudo para a pesquisa em questão.

          Plataforma citada nas perguntas se refere a algum tipo se sistema, software, programa ou aplicativo que possa ter sido desenvolvido no estudo,
          caso não haja menção informe que não foi encontrado tal tipo de solução, mas o estudo propoe alguma outra solução.

          8. Perguntas de Pesquisa (RQs)
            8.1. RQ1: Se existente, o que caracteriza a plataforma do ecossistema de economia circular?
            8.2. RQ2: Quais são os problemas relatados no ecossistema nacional?
            8.3. RQ3: Como empresas fazem a logística reversa para distribuidores ou fábricas?
            8.4. RQ4: Se existente, como as plataformas abordaram a questão de cooperação e competir no ecossistema?
            8.5. RQ5: Como o estudo aborda práticas, métodos ou iniciativas que envolvam coopetição (cooperação + competição).
          9. Critérios de Inclusão (IC)
            9.1. IC1: O estudo deve abordar o ecossistema de economia circular no Brasil, considerando resíduos sólidos, reciclagem ou logística reversa.
            9.1. IC2: O estudo deve explorar iniciativas de organizações privadas, públicas ou ONGs com relação à economia circular.
            9.1. IC3: O estudo deve estar publicado em formato de artigo completo (sem restrições de idioma, mas preferencialmente em português e inglês).
          10. Critérios de Exclusão (EC)
            10.1. EC1: Estudos publicados antes de 2010, pois está foi a data foi sancionada a Lei nº 12.305, de 2 de agosto de 2010. Institui a Política Nacional de Resíduos Sólidos;
            10.1. EC2: Estudos duplicados ou incompletos.
            10.1. EC3: Estudos disponíveis apenas na forma de resumo, apresentação de slides ou pôster.
            10.1. EC4: Estudos que não abordem nenhum aspecto prático ou tecnológico aplicável ao contexto da economia circular e reciclagem.
            10.1. EC5: Estudos que estão disponíveis para download para periódicos da CAPES ou que não estejam com acesso aberto.

         
          **Texto para análise:**
          ${raw}
        
          **Formato esperado de resposta (exemplo):**

          Alguns arquivos são HTML esses arquivos são site que falam sobre o assunto, então é necessário fazer uma análise do conteúdo do site e não do HTML. Caso o conteudo do HTML estiver incompleto, retorne em todos os campos que: "não foi possivel analisar o documento pela página esta incompleta". 
          {
            title: "Título do Artigo",
            authors: ["Autor 1", "Autor 2"],
            description: "Resumo detalhado do artigo.",
            date_published: "dd/mm/aaaa"
            keywords: ["keyword 1", "keyword 2"],
            citation: "Citação em formato ABNT",
            research_questions: [
              'RQ1':{
                question: 'Pergunta de Pesquisa 1',
                answer: 'Traga uma resposta de dentro do artigo que justifique a pergunta, sempre que possivel traga citações de dentro do artigo para confirmar sua resposta.'
              }
            ],
            inclusion_criteria: [
              'IC1':{
                criteria: 'Critério de Inclusão 1',
                answer: 'Traga uma resposta de dentro do artigo que justifique a pergunta, sempre que possivel traga citações de dentro do artigo para confirmar sua resposta.',
                validation: 'caso o critério seja atendido retorne true, caso contrário false'
              }
            ],
            exclusion_criteria: [
              'EC1':{
                criteria: 'Critério de Exclusão 1',
                answer: 'Traga uma resposta de dentro do artigo que justifique a pergunta, sempre que possivel traga citações de dentro do artigo para confirmar sua resposta.'
                validation: 'caso o critério seja atendido retorne true, caso contrário false'
              }
            ],
          }
        `;

  const encoding = encoding_for_model(model);

  // Codifica o texto em tokens
  const tokens = encoding.encode(content);

  // Verifica o tamanho e corta se necessário
  if (tokens.length > 128000) {
    console.log(
      `\nMensagem muito longa: ${
        tokens.length
      } tokens. Reduzindo para ${128000} tokens.`
    );
    const truncatedTokens = tokens.slice(0, 127000);
    content = new TextDecoder("utf-8").decode(encoding.decode(truncatedTokens)); // Retorna o texto truncado
  }

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "Você é um assistente especializado em análise e extração de informações de textos científicos. Seu objetivo é processar textos acadêmicos, identificar e estruturar informações relevantes, como resumo, objetivos, metodologia, resultados, e conclusões, retornando essas informações em formato JSON bem organizado. Sempre mantenha uma abordagem precisa e acadêmica.",
      },
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.6,
  });

  // console.log(completion);

  // // Extrair o conteúdo JSON da resposta
  // const openAiResponse = completion.choices[0].message.content;

  // // Remover delimitadores de bloco de código (```json e ```)
  // const extractedContent = openAiResponse!.replace(/```json|```/g, "").trim();

  // // Parse o JSON para validar
  // const parsedResponse = JSON.parse(extractedContent);

  // Salvar o JSON em um arquivo
  fs.writeFileSync(
    path.resolve(repositoryDir, `${articleId}.json`),
    JSON.stringify(completion, null, 2)
  );

  // console.log("Resposta salva em response.json");

  return right(new OpenAiSuccess());
}
