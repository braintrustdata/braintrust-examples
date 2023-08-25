import * as fs from "fs";
import * as braintrust from "braintrust";
import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionResponse,
  OpenAIApi,
} from "openai";


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

function printSection(sectionText: string) {
  console.log("");
  console.log("=".repeat(sectionText.length));
  console.log(sectionText);
  console.log("=".repeat(sectionText.length));
  console.log("");
}

function initializeOpenAI(): OpenAIApi {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  return openai;
}

async function classifyTitle(openai: OpenAIApi, prompt: string, title: Title) {
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: `Article title: ${title.text}`,
    },
  ];

  const response = await openai.createChatCompletion({
      model: OPENAI_MODEL,
      messages: messages,
  });

  return response.data;
}

function getCategoryFromResponse(response: CreateChatCompletionResponse): string {
  if (response.choices.length == 0) {
    return '';
  }
  const choice = response.choices[0];
  if (!choice.message || !choice.message.content) {
    return '';
  }
  const content = choice.message.content;
  return content.toLowerCase();
}

async function analyzeExperiment(
  name: string,
  prompt: string,
  dataset: Dataset,
  responses: CreateChatCompletionResponse[]) {
  let experiment = await braintrust.init("classify-article-titles", {
    experiment: name,
  });

  const titles = dataset.titles;
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const response = responses[i];
    const responseCategory = getCategoryFromResponse(response);
    const expectedCategory = dataset.categories[title.label].toLowerCase();

    experiment.log({
      inputs: { title: title.text },
      output: responseCategory,
      expected: expectedCategory,
      metadata: {
        "prompt": prompt,
      },
      scores: {
        "match": responseCategory == expectedCategory ? 1 : 0,
        "valid": dataset.categories.indexOf(responseCategory) != -1 ? 1 : 0,
      },
    });
  }
}

async function runOnAllTitles(
  openai: OpenAIApi,
  prompt: string,
  titles: Title[]): Promise<CreateChatCompletionResponse[]> {
    const startTime = performance.now();
    const promises = titles.map(title => classifyTitle(openai, prompt, title));
    const ret = await Promise.all(promises);
    const endTime = performance.now();
    console.log(`Processed ${titles.length} titles in ${(endTime - startTime) / 1000} seconds`);
    return ret;
};


async function main() {
  const openai = initializeOpenAI();
  const dataset = await loadDataset();
  const titles = dataset.titles;
  const title = titles[0];

  // Welcome to BrainTrust! This tutorial will teach you the basics of working with BrainTrust
  // to evaluate a text classification use case, including creating a project, running
  // experiments, and analyzing their results.

  // Let's analyze the first example, and build up a prompt for categorizing a title.
  // The prompt provides the article's title to the model, and asks it to generate a category.

  printSection("Let's ask the model to classify our first title");
  console.log(`Title: ${title.text}`);
  console.log(`Expected category: ${dataset.categories[title.label]}`);

  const prompt = `
      You are an editor in a newspaper who helps writers identify the right category for
      their news articles, by reading the article's title. The category should be one of
      the following: World, Sports, Business, or Sci-Tech. Reply with one word corresponding
      to the category`;

  const response = await classifyTitle(openai, prompt, title);
  console.log(`Picked category: ${getCategoryFromResponse(response)}`);

  // Now that we have automated the process of classifying titles, we can test the full set of
  // articles. This section uses Python's async features to generate and grade in parallel,
  // effectively making your OpenAI account's rate limit the limiting factor.
  // As it runs, it compares the generated category to the expected one from the dataset.
  // Once this loop completes, you can view the results in BrainTrust.

  printSection(`Running across the dataset`);
  const responses = await runOnAllTitles(openai, prompt, titles);
  analyzeExperiment("original-prompt", prompt, dataset, responses);

  // Find a title that was not categorized correctly.
  const invalidIndex = responses.findIndex((response: CreateChatCompletionResponse) => {
    const responseCategory = getCategoryFromResponse(response);
    return dataset.categories.indexOf(responseCategory) == -1;
  });

  // Have you spotted the issue yet? Looks like we have mispelled one of our categories in our
  // prompt. The dataset's categories are "World, Sports, Business and Sci/Tech" - but we are
  // using "Sci-Tech" in our prompt. Let's fix it:

  printSection("The following title was wrongly categorized");
  console.log("Title: ", titles[invalidIndex].text);
  console.log("Expected category: ", dataset.categories[titles[invalidIndex].label]);
  console.log("Actual category: ", getCategoryFromResponse(responses[invalidIndex]));

  const fixedPrompt = `
      You are an editor in a newspaper who helps writers identify the right category for
      their news articles, by reading the article's title. The category should be one of
      the following: World, Sports, Business, or Sci/Tech. Reply with one word corresponding
      to the category`;

  printSection(`Re-running wrongly categorized title with new prompt:`);
  const fixedResponse = await classifyTitle(openai, fixedPrompt, titles[invalidIndex]);
  console.log("Title: ", titles[invalidIndex].text);
  console.log("Expected category: ", dataset.categories[titles[invalidIndex].label]);
  console.log("Actual category: ", getCategoryFromResponse(fixedResponse));

  // This time around, the model generated the expected categories. But how do we know how it
  // affects the overall dataset? Let's run the new prompt on our full set of titles, and take
  // a look at the experiment.

  const fixedResponses = await runOnAllTitles(openai, fixedPrompt, titles);
  analyzeExperiment("fixed-categories", fixedPrompt, dataset, fixedResponses);
}

main();
