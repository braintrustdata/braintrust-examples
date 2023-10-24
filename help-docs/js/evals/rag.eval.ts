import { Eval, currentSpan } from "braintrust";
import { Factuality } from "autoevals";

import {
  NUM_QA_PAIRS,
  NUM_SECTIONS,
  buildData,
  buildMarkdownSections,
} from "./load";
import { chatCompletion, embedText, openai } from "./oai";
import { simpleQA } from "@/util/prompts";

import lancedb from "vectordb";
const lanceimport = require("vectordb");

const MODEL = "gpt-3.5-turbo";

let db: lancedb.Connection | null = null;
async function getDb() {
  if (db === null) {
    db = await lanceimport.connect("data/sample-lancedb");
  }
  return db!;
}

Eval("coda-help-desk", {
  data: async () => {
    const docs = (await buildMarkdownSections()).splice(0, NUM_SECTIONS);
    const db = await getDb();
    if (!(await db.tableNames()).find((t) => t === "docs")) {
      console.log("RECREATING TABLE");
      const embeddings = await Promise.all(
        docs.map((d) =>
          embedText({
            input: d.markdown,
            model: "text-embedding-ada-002",
          })
        )
      );

      await db.createTable({
        name: "docs",
        data: docs.map((d, idx) => {
          const embedding = embeddings[idx];
          return {
            docId: d.docId,
            sectionId: d.sectionId,
            vector: embedding.data[0].embedding,
          };
        }),
      });
    }
    const pairs = await buildData();
    return pairs.splice(0, 1);
  },
  task: async (input, { span }) => {
    const db = await getDb();
    const table = await db.openTable("docs");

    const embedding = await embedText({
      input,
      model: "text-embedding-ada-002",
    });

    const docs = await span.traced("Vector Search", async (span) => {
      const result = await table
        .search({
          embedding: embedding.data[0].embedding,
        })
        .limit(5)
        .execute();

      return result;
    });
    console.log("DOCS", docs);

    const res = await chatCompletion({
      model: MODEL,
      messages: simpleQA(input),
      temperature: 0,
    });
    return res.choices[0].message!.content!;
  },
  scores: [Factuality],
});
