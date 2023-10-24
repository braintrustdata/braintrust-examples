import path from "path";
import fs from "fs";
import util from "util";
import zlib from "zlib";
import axios from "axios";
import OpenAI from "openai";

import { MarkdownSection, QAData, QAPairs, QAPairsSchema } from "./types";

function checkEnvVar(name: string) {
  if (!process.env[name]) {
    console.log(
      `Please set the ${name} environment variable to run this script.`
    );
    process.exit(1);
  }
}

checkEnvVar("OPENAI_API_KEY");
checkEnvVar("BRAINTRUST_API_KEY");

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const QA_GEN_MODEL = "gpt-3.5-turbo";
export const QA_ANSWER_MODEL = "gpt-3.5-turbo";
export const QA_GRADING_MODEL = "gpt-3.5-turbo";
export const RELEVANCE_MODEL = "gpt-3.5-turbo";
export const NUM_SECTIONS = 40;
export const NUM_QA_PAIRS = 20;

const CACHE_PATH = "./cache";
async function ensureCachedFile(
  name: string,
  download: (path: string) => Promise<void>
) {
  fs.mkdirSync(CACHE_PATH, { recursive: true });

  const fullPath = path.join(CACHE_PATH, name);
  if (fs.existsSync(fullPath)) {
    return;
  }

  await download(fullPath);
}

async function buildMarkdownSections() {
  await ensureCachedFile("markdown_docs.json", async (path) => {
    const fullUrl = `https://braintrust-public.s3.amazonaws.com/help-desk/markdown_docs.json.gz`;
    const resp = await axios.get(fullUrl, {
      responseType: "arraybuffer",
    });
    const unzipped = await util.promisify(zlib.gunzip)(resp.data);
    fs.writeFileSync(path, unzipped);
  });
  const markdownDocs = JSON.parse(
    await util.promisify(fs.readFile)(
      path.join(CACHE_PATH, "markdown_docs.json"),
      "utf8"
    )
  );

  let i = 0;
  const markdownSections: MarkdownSection[] = [];
  for (const markdownDoc of markdownDocs) {
    const sections = markdownDoc.markdown.split(/(.*\n=+\n)/);
    let current_section = "";
    for (const section of sections) {
      if (!section.trim()) {
        continue;
      }

      if (section.match(/.*\n=+\n/)) {
        current_section = section;
      } else {
        const fullSection = current_section + section;
        markdownSections.push({
          docId: markdownDoc.id,
          sectionId: i,
          markdown: fullSection.trim(),
        });
        current_section = "";
        i += 1;
      }
    }
  }

  return markdownSections;
}

let sectionsStarted = 0;
async function produceCandidateQuestions(
  section: MarkdownSection
): Promise<QAPairs> {
  sectionsStarted += 1;
  console.log(`Starting section ${sectionsStarted} of ${NUM_SECTIONS}`);
  const response = await openai.chat.completions.create({
    model: QA_GEN_MODEL,
    messages: [
      {
        role: "user",
        content: `
Please generate 8 question/answer pairs from the following text. For each question, suggest
2 different ways of phrasing the question, and provide a unique answer.

Content:

${section["markdown"]}
`,
      },
    ],
    functions: [
      {
        name: "propose_qa_pairs",
        description: "Propose some question/answer pairs for a given document",
        parameters: QAPairsSchema,
      },
    ],
  });

  sectionsStarted -= 1;
  console.log(
    `Finished section (${sectionsStarted} remaining of ${NUM_SECTIONS})`
  );

  try {
    return JSON.parse(response.choices![0].message!.function_call!.arguments);
  } catch (e) {
    console.warn(
      "Invalid response from OpenAI API: " + JSON.stringify(response)
    );
    return { pairs: [] };
  }
}
async function setupQAPairs(
  markdownSections: MarkdownSection[]
): Promise<QAData[]> {
  await ensureCachedFile("qa_pairs.json", async (path) => {
    const usedSections = markdownSections.slice(0, NUM_SECTIONS);
    const allCandidates = await Promise.all(
      usedSections.map(produceCandidateQuestions)
    );

    let rowId = 0;
    const data: QAData[] = [];
    for (let qaIdx = 0; qaIdx < allCandidates.length; qaIdx++) {
      const section = usedSections[qaIdx];
      const candidates = allCandidates[qaIdx];
      for (let i = 0; i < candidates.pairs.length; i++) {
        for (let j = 0; j < candidates.pairs[i].questions.length; j++) {
          const question = candidates.pairs[i].questions[j];
          const answer = candidates.pairs[i].answer;
          data.push({
            input: question,
            expected: answer,
            metadata: {
              document_id: section.docId,
              section_id: section.sectionId,
              topic_idx: i,
              question_idx: j,
              id: rowId,
              split:
                j == candidates.pairs[i].questions.length - 1 && j > 0
                  ? "test"
                  : "train",
            },
          });
          rowId += 1;
        }
      }
    }

    // Write to path
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  });

  return JSON.parse(
    await util.promisify(fs.readFile)(
      path.join(CACHE_PATH, "qa_pairs.json"),
      "utf8"
    )
  );
}

export async function buildData() {
  return await setupQAPairs(await buildMarkdownSections());
}
