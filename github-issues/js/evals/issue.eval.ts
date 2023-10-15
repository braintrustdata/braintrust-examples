import { Eval } from "braintrust";
import { Summary } from "autoevals";

import { loadIssues } from "./load";
import { chatCompletion } from "./oai";
import { titleGeneratorMessages } from "@/util/prompts";

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
  task: async (input, { span }) => {
    const res = await chatCompletion(span, {
      model: MODEL,
      messages: titleGeneratorMessages(input),
      temperature: 0,
    });
    return res.choices[0].message!.content!;
  },
  scores: [Summary],
});
