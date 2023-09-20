import { Eval } from "braintrust";

import { classifyTitle, initializeOpenAI, loadDataset } from "./utils";


const openai = initializeOpenAI();


import  {ChromaClient} from 'chromadb';
const client = new ChromaClient();

/*
This is an example of how to use BrainTrust's Eval framework to run experiments.
This is optional to use but it makes your evaluation script shorter and easier to read.
Learn more @ https://www.braintrustdata.com/docs/guides/evals
*/
Eval("eval-assistant-answers", {
  data: async () => {
    const dataset = loadDataset();
    return dataset;
  },

  task: async (title: string, { meta }) => {
    const response = await classifyTitle(openai, prompt, title);
    meta({ prompt, response });
    return response.choices[0].message!.content?.toLowerCase();
  },

  scores: [
    args => {
      return {
        name: 'match',
        score: (args.output == args.expected) ? 1.0 : 0.0,
      };
    },
    args => {
      return {
        name: 'match',
        score: (args.output == args.expected) ? 1.0 : 0.0,
      };
    },
  ],
});

// Eval("classify-article-titles-fix", {
//   data: async () => {
//     const dataset = await loadDataset();
//     const data = dataset.titles.map(title => {
//       return {
//         input: title.text,
//         expected: dataset.categories[title.label],
//       };
//     });
//     return data;
//   },

//   task: async (title: string, { meta }) => {
//     const response = await classifyTitle(openai, fixedPrompt, title);
//     meta({ prompt, response });
//     return response.choices[0].message!.content?.toLowerCase();
//   },

//   scores: [
//     args => {
//       return {
//         name: 'match',
//         score: (args.output == args.expected) ? 1.0 : 0.0,
//       };
//     },
//   ],
// });