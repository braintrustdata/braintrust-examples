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
      const { title, ...metadata } = issue.metadata;
      return {
        input: issue.page_content,
        expected: title,
        metadata,
      };
    });
  },
  task: async (input, { span }) => {
    return await span.startSpanWithCallback({ name: "foo" }, async (span) => {
      const res = await openai.chat.completions.create({
        model: MODEL,
        messages: titleGeneratorMessages(input),
        temperature: 0,
      });
      span.log({ input: "foo" });
      return res.choices[0].message!.content!;
    });
    return span.startSpanWithCallback(
      {
        name: "OpenAI Completion",
      },
      async () => {
        // XXX Wrap the OpenAI call here
        const res = await openai.chat.completions.create({
          model: MODEL,
          messages: titleGeneratorMessages(input),
          temperature: 0,
        });
        /*
   input = input_args.pop("messages")
    span.log(
        metrics={
            "tokens": response["usage"]["total_tokens"],
            "prompt_tokens": response["usage"]["prompt_tokens"],
            "completion_tokens": response["usage"]["completion_tokens"],
        },
        metadata={**input_args, **kwargs},
        input=input,
        output=response["choices"][0],
    )
    */
        span.log({
          metrics: {
            tokens: res.usage?.total_tokens,
            prompt_tokens: res.usage?.prompt_tokens,
            completion_tokens: res.usage?.completion_tokens,
          },
        });
        return res.choices[0].message!.content!;
      }
    );
  },
  scores: [Summary],
});
