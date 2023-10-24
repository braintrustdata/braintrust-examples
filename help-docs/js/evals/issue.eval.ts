import { Eval, currentSpan } from "braintrust";
import { Summary, LevenshteinScorer } from "autoevals";

import { loadIssues } from "./load";
import { chatCompletion } from "./oai";
import { simpleQA } from "@/util/prompts";

const MODEL = "gpt-3.5-turbo";

Eval("gh-issues", {
  data: async () => {
    const issues = await loadIssues();
    return issues.map((issue) => {
      const { title, ...metadata } = issue.metadata;
      return {
        input: issue.page_content,
        expected: title,
        metadata,
      };
    });
  },
  task: async (input) => {
    const res = await chatCompletion(currentSpan(), {
      model: MODEL,
      messages: simpleQA(input),
      temperature: 0,
    });
    return res.choices[0].message!.content!;
  },
  scores: [Summary, LevenshteinScorer],
});
