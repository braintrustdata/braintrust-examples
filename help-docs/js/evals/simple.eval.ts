import { Eval, currentSpan } from "braintrust";
import { Factuality } from "autoevals";

import { NUM_QA_PAIRS, buildData } from "./load";
import { chatCompletion } from "./oai";
import { simpleQA } from "@/util/prompts";

const MODEL = "gpt-3.5-turbo";

Eval("coda-help-desk", {
  data: async () => {
    const pairs = await buildData();
    return pairs.splice(0, NUM_QA_PAIRS);
  },
  task: async (input) => {
    const res = await chatCompletion({
      model: MODEL,
      messages: simpleQA(input),
      temperature: 0,
    });
    return res.choices[0].message!.content!;
  },
  scores: [Factuality],
});
