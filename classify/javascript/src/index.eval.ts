import { Eval } from "braintrust";
import {
  ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
} from "openai";

import * as fs from "fs";

// If you would like to avoid loading the dataset from Hugging Face, or would
// like to play with the dataset locally, specify a filename here, and the
// script will load the data from it.
const DATA_FILE_PATH: string = "";
const OPENAI_MODEL: string = "gpt-3.5-turbo";
const NUM_TITLES: number = 100;

type Title = {
  text: string,
  label: number,
}

type Dataset = {
  titles: Title[],
  categories: string[],
}

function buildHuggingFaceUrl() {
  const baseUrl = "https://datasets-server.huggingface.co";
  const url = new URL("/rows", baseUrl);
  url.searchParams.set("dataset", "ag_news");
  url.searchParams.set("config", "default");
  url.searchParams.set("split", "test");
  url.searchParams.set("offset", "0");
  url.searchParams.set("limit", NUM_TITLES.toString());
  return url.toString();
}

async function loadDataset(): Promise<Dataset> {
  let jsonData = {};

  if (DATA_FILE_PATH && DATA_FILE_PATH.length > 0) {
    jsonData = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf8'));
  } else {
    const url = buildHuggingFaceUrl();
    const response = await fetch(url);
    jsonData = await response.json()
  }

  const titles: Title[] = [];
  for (const row of jsonData["rows"]) {
    titles.push({
      text: row["row"]["text"] as string,
      label: row["row"]["label"] as number,
    });
  }

  const categoriesFeature = jsonData["features"].find((f: Record<string, unknown>) => {
    return f["name"] == "label";
  });

  const categories = (categoriesFeature?.type?.names || []).map((c: string) => c.toLowerCase());

  return {
    titles: titles,
    categories: categories,
  }
}

function initializeOpenAI(): OpenAIApi {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  return openai;
}

async function classifyTitle(openai: OpenAIApi, prompt: string, title: string) {
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: `Article title: ${title}`,
    },
  ];

  const response = await openai.createChatCompletion({
      model: OPENAI_MODEL,
      messages: messages,
  });

  return response.data;
}


const openai = initializeOpenAI();
const prompt = `
    You are an editor in a newspaper who helps writers identify the right category for
    their news articles, by reading the article's title. The category should be one of
    the following: World, Sports, Business, or Sci-Tech. Reply with one word corresponding
    to the category`;

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

  task: async (title: string) => {
    const response = await classifyTitle(openai, prompt, title);
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
