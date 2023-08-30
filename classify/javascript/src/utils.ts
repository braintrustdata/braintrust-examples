import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionResponse, OpenAIApi } from "openai";
import * as braintrust from "braintrust";

const NUM_TITLES: number = 100;
const DATA_FILE_PATH: string = "";

import * as fs from "fs";

export type Title = {
    text: string,
    label: number,
}

// Define some helper functions for classifying titles.
export async function classifyTitle(openai: OpenAIApi, prompt: string, title: Title) {
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
        model: "gpt-3.5-turbo",
        messages: messages,
    });

    return response.data;
}

export function getCategoryFromResponse(response: CreateChatCompletionResponse): string {
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


export async function analyzeExperiment(
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

export async function runOnAllTitles(
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


export function initializeOpenAI(): OpenAIApi {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    return openai;
}

export function printSection(sectionText: string) {
    console.log("");
    console.log("=".repeat(sectionText.length));
    console.log(sectionText);
    console.log("=".repeat(sectionText.length));
    console.log("");
}


export type Dataset = {
    titles: Title[],
    categories: string[],
}

export function buildHuggingFaceUrl() {
    const baseUrl = "https://datasets-server.huggingface.co";
    const url = new URL("/rows", baseUrl);
    url.searchParams.set("dataset", "ag_news");
    url.searchParams.set("config", "default");
    url.searchParams.set("split", "test");
    url.searchParams.set("offset", "0");
    url.searchParams.set("limit", NUM_TITLES.toString());
    return url.toString();
}

export async function loadDataset(): Promise<Dataset> {
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