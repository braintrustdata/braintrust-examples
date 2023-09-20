import { Eval } from "braintrust";

import {  initVectorDB, initializeOpenAI, loadDataset } from "./utils";
import { LevenshteinScorer, Factuality } from "autoevals";

import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";


/*
This is an example of how to use BrainTrust's Eval framework to run experiments.
This is optional to use but it makes your evaluation script shorter and easier to read.
Learn more @ https://www.braintrustdata.com/docs/guides/evals
*/
Eval("eval-assistant-answers", {
  data: async () => {
    const dataset = loadDataset();
    await initVectorDB();
    return dataset;
  },

  task: async (input: string, { meta }) => {
    const answer = await generateAnswer(input);

    return answer;
  },

  scores: [
    async (args) => {
      const score = await LevenshteinScorer(args);
      
      return score;
    },
    async (args) => {
      const score = await Factuality(args);
      
      return score;
    },
  ],
});
