import { Eval, currentSpan } from "braintrust";
import { Factuality } from "autoevals";

import {
  NUM_QA_PAIRS,
  NUM_SECTIONS,
  RELEVANCE_MODEL,
  buildData,
  buildMarkdownSections,
} from "./load";
import { chatCompletion, embedText, openai } from "./oai";
import { ragQA, simpleQA } from "@/util/prompts";
import similarity from "compute-cosine-similarity";
import { MarkdownSection } from "./types";

const MODEL = "gpt-3.5-turbo";
const TOP_K = 2;

interface Vector {
  docId: number;
  sectionId: number;
  vector: number[];
}

let vectors: Vector[] = [];
let sections: MarkdownSection[] = [];

Eval("coda-help-desk", {
  data: async () => {
    sections = (await buildMarkdownSections()).splice(0, NUM_SECTIONS);
    const embeddings = await Promise.all(
      sections.map((d) =>
        embedText({
          input: d.markdown,
          model: "text-embedding-ada-002",
        })
      )
    );

    vectors = sections.map((d, idx) => {
      const embedding = embeddings[idx];
      return {
        docId: d.docId,
        sectionId: d.sectionId,
        vector: embedding.data[0].embedding,
      };
    });

    const pairs = await buildData();
    return pairs.splice(0, NUM_QA_PAIRS);
  },
  task: async (input, { span }) => {
    const embedding = await embedText({
      input,
      model: "text-embedding-ada-002",
    });

    const docs = await span.traced("Vector Search", async (span) => {
      const similarities = vectors.map((v) => ({
        ...v,
        similarity: similarity(v.vector, embedding.data[0].embedding),
      }));
      similarities.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      const topMany = similarities.slice(0, 3);
      const relevanceScores = await Promise.all(
        topMany.map((v) =>
          span.traced("Relevance Score", async (span) => {
            return await relevanceScore(input, sections[v.sectionId].markdown);
          })
        )
      );
      const MinRelevance = Math.min(...relevanceScores);
      const MaxRelevance = Math.max(...relevanceScores);
      const AvgRelevance =
        relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length;
      span.log({
        input: input,
        output: topMany.map((v, idx) => ({
          doc: sections[v.sectionId].markdown,
          similarity: v.similarity,
          relevance: relevanceScores[idx],
        })),
        metadata: {
          top_k: TOP_K,
          retrieval: topMany,
        },
        scores: {
          MinRelevance,
          MaxRelevance,
          AvgRelevance,
        },
      });

      return topMany;
    });

    const contexts = docs
      .splice(0, TOP_K)
      .map((d) => sections[d.sectionId].markdown);

    const res = await chatCompletion({
      model: MODEL,
      messages: ragQA(input, contexts),
      temperature: 0,
    });
    return res.choices[0].message!.content!;
  },
  scores: [Factuality],
});

async function relevanceScore(query: string, document: string) {
  const response = await chatCompletion({
    model: RELEVANCE_MODEL,
    messages: [
      {
        role: "user",
        content: `Consider the following query and a document

Query:
${query}

Document:
${document}


Please score the relevance of the document to a query, on a scale of 0 to 1.`,
      },
    ],
    functions: [
      {
        name: "has_relevance",
        description: "Declare the relevance of a document to a query",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number" },
          },
        },
      },
    ],
  });

  const result = JSON.parse(
    response.choices![0].message!.function_call!.arguments
  );
  currentSpan().log({
    input: { query: query, document: document },
    output: response,
  });

  return result.score;
}
