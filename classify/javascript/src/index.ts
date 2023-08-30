import {
  CreateChatCompletionResponse, OpenAIApi
} from "openai";
import { Dataset, Title, analyzeExperiment, classifyTitle, getCategoryFromResponse, initializeOpenAI, loadDataset, printSection, runOnAllTitles } from "./utils";
import * as braintrust from "braintrust";


async function main() {
  /*
  This tutorial help you get started with building reliable AI apps with BrainTrust.
  We'll build annd iterate on an app that classifies news articles based on their titles into categories.
  Start by loading the `ag_news` dataset from HuggingFace.
  */
  const dataset = await loadDataset();
  const titles = dataset.titles;
  const title = titles[0];

  // We'll use OpenAI's library to generate LLM completions. Feel free to use any library you like: Guidance, Langchain, etc.
  const openai = initializeOpenAI();

  // Let's start with a simple example to classify one title.
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

  /* 
  Now, let's see evaluate our AI app performs across more examples in the dataset.
  BrainTrust makes it easy to log our evaluation results and dig into the results to fix issues.
  We'll start by defining some helper functions to make running experiments easier.
  */
  printSection(`Running experiment across the dataset`);
  // Generate all classifications
  const responses = await runOnAllTitles(openai, prompt, titles);

  // Grade and log results to BrainTrust
  async function analyzeExperiment(
    name: string,
    prompt: string,
    dataset: Dataset,
    responses: CreateChatCompletionResponse[]) {

    // Initialize a BrainTrust experiment
    let experiment = await braintrust.init("classify-article-titles", {
      experiment: name,
    });

    const titles = dataset.titles;
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const response = responses[i];
      const responseCategory = getCategoryFromResponse(response);
      const expectedCategory = dataset.categories[title.label].toLowerCase();

      // Log to BrainTrust
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
    // Log experiment summary to console (including links to the experiment in BrainTrust)
    console.log(experiment.summarize());
  }
  await analyzeExperiment("original-prompt", prompt, dataset, responses);
  console.log(`Finished running experiment across the dataset`);

  /*
  The function above will print a link to the BrainTrust experiment.
  Click on it to investigate which test cases fail and how we can improve our AI app.
  Looking at our results table, we we incorrectly output `sci-tech` instead of `sci/tech`.
  This results in a failed eval test case. Let's fix it.

  First, let's see if we can reproduce this issue locally.
  We can test an article corresponding to the "Sci/Tech" category and reproduce the evaluation:
  */
  const invalidIndex = responses.findIndex((response: CreateChatCompletionResponse) => {
    const responseCategory = getCategoryFromResponse(response);
    return dataset.categories.indexOf(responseCategory) == -1;
  });

  printSection("The following title was wrongly categorized");
  console.log("Title: ", titles[invalidIndex].text);
  console.log("Expected category: ", dataset.categories[titles[invalidIndex].label]);
  console.log("Actual category: ", getCategoryFromResponse(responses[invalidIndex]));

  /*
  Have you spotted the issue?
  We have mispelled one of the categories in our prompt.
  The dataset's categories are: "World, Sports, Business and Sci/Tech", but we are using Sci-Tech in our prompt. 
  Let's fix it with a new prompt.
  Then, we'll run a new experiment to verify the new prompt works using BrainTrust. 
  */
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

  /*
  The model classified the correct category Sci/Tech for this one example.
  But, how do we know it works for the rest of the dataset?
  Let's run a new experiment to evaluate our new prompt using BrainTrust.
  */
  printSection(`Re-running wrongly categorized title with new prompt:`);
  const fixedResponses = await runOnAllTitles(openai, fixedPrompt, titles);
  await analyzeExperiment("fixed-categories", fixedPrompt, dataset, fixedResponses);
}

await main();
