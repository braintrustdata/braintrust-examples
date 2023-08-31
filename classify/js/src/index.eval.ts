import { Eval } from "braintrust";

import { classifyTitle, initializeOpenAI, loadDataset } from "./utils";


const openai = initializeOpenAI();
const prompt = `
You are an editor in a newspaper who helps writers identify the right category for
their news articles, by reading the article's title. The category should be one of
the following: World, Sports, Business, or Sci-Tech. Reply with one word corresponding
to the category`;

const fixedPrompt = `
You are an editor in a newspaper who helps writers identify the right category for
their news articles, by reading the article's title. The category should be one of
the following: World, Sports, Business, or Sci/Tech. Reply with one word corresponding
to the category`;


/*
This is an example of how to use BrainTrust's Eval framework to run experiments.
This is optional to use but it makes your evaluation script shorter and easier to read.
Learn more @ https://www.braintrustdata.com/docs/guides/evals
*/
Eval("classify-article-titles", {
  data: async () => {
    const dataset = await loadDataset();
    const data = dataset.titles.map(title => {
      return {
        input: title.text,
        expected: dataset.categories[title.label],
      };
    });
    return data;
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
  ],
});

Eval("classify-article-titles-fix", {
  data: async () => {
    const dataset = await loadDataset();
    const data = dataset.titles.map(title => {
      return {
        input: title.text,
        expected: dataset.categories[title.label],
      };
    });
    return data;
  },

  task: async (title: string, { meta }) => {
    const response = await classifyTitle(openai, fixedPrompt, title);
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
  ],
});