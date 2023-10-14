import { Eval, initDataset } from "braintrust";
import { Summary } from "autoevals";
import OpenAI from "openai";

import { titleGeneratorMessages } from "@/app/api/completion/route";
import { loadIssues } from "./load";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const MODEL = "gpt-3.5-turbo";

Eval("gh-issues", {
  data: async () => {
    const issues = await loadIssues();
    return issues.map((issue) => {
      return {
        input: issue.page_content,
        expected: issue.metadata.title,
      };
    });
  },
  task: async (input) => {
    const res = await openai.chat.completions.create({
      model: MODEL,
      messages: titleGeneratorMessages(input),
      temperature: 0,
    });
    return res.choices[0].message!.content!;
  },
  scores: [Summary],
});
