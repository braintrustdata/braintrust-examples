import * as fs from "fs";
import * as zlib from "zlib";
import * as util from "util";
import axios from "axios";

import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionRequest,
  OpenAIApi,
} from "openai";
import * as sqlite3 from "sqlite3";
import * as braintrust from "braintrust";
import throttledQueue from "throttled-queue";

const CACHE_PATH = "./cache";
fs.mkdirSync(CACHE_PATH, { recursive: true });

function checkEnvVar(name: string) {
  if (!process.env[name]) {
    console.log(
      `Please set the ${name} environment variable to run this script.`
    );
    process.exit(1);
  }
}

checkEnvVar("OPENAI_API_KEY");
checkEnvVar("BRAINTRUST_API_KEY");
checkEnvVar("BRAINTRUST_API_URL");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const MODEL = "gpt-3.5-turbo";
const REPO = "supabase/supabase";
const N_ISSUES = 20;
main();

async function main() {
  const issues = await loadIssues();

  let issue = issues[0];
  printSection(`Let's inspect ${issue.metadata.url}`);
  console.log(issue.metadata.title);
  console.log("-".repeat(issue.metadata.title.length));
  console.log(issue.page_content);

  printSection(`Can we do better with a prompt?`);
  let createTitle = (pageContent: string): ChatCompletionRequestMessage[] => [
    {
      role: "system",
      content: `You are a technical project manager who helps software engineers generate better titles for their GitHub issues,
by looking at their issue descriptions. The titles should be clear and concise one-line statements.`,
    },
    {
      role: "user",
      content: pageContent,
    },
  ];

  let title = (
    await cachedChatCompletion({
      model: MODEL,
      messages: createTitle(issue.page_content),
    })
  ).choices[0].message!.content!;
  console.log(title);

  printSection(`Grading the new title`);

  let gradeTitle = (
    pageContent: string,
    title1: string,
    title2: string
  ): ChatCompletionRequestMessage[] => [
    {
      role: "system",
      content: `You are a technical project manager who helps software engineers generate better titles for their GitHub issues.
You will look at the issue description, and pick which of two titles better describes it.`,
    },
    {
      role: "user",
      content: `I'm going to provide you with the issue description, and two possible titles.

Issue Description: ${pageContent}

Title 1: ${title1}
Title 2: ${title2}

Please discuss each title briefly (one line for pros, one for cons), and then pick which one you think more accurately
summarizes the issue by writing "Winner: 1" or "Winner: 2", and then a short rationale for your choice.`,
    },
  ];

  let grade = (
    await cachedChatCompletion({
      model: MODEL,
      messages: gradeTitle(issue.page_content, title, issue.metadata.title),
    })
  ).choices[0].message!.content!;
  console.log(grade);
  console.log("Best Title: " + parseBestTitle(grade));

  printSection(`Running across the dataset`);

  let evaluateIssue = async (issue: any) => {
    const title = (
      await cachedChatCompletion({
        model: MODEL,
        messages: createTitle(issue.page_content),
      })
    ).choices[0].message!.content!;
    const grade = (
      await cachedChatCompletion({
        model: MODEL,
        messages: gradeTitle(issue.page_content, title, issue.metadata.title),
      })
    ).choices[0].message!.content!;

    return { title, grade };
  };

  let runOnAllIssues = async () => {
    const startTime = performance.now();
    const promises = issues.map(evaluateIssue);
    const ret = await Promise.all(promises);
    const endTime = performance.now();
    console.log(`Took ${(endTime - startTime) / 1000} seconds`);
    return ret;
  };

  let titleGrades = await runOnAllIssues();

  let experiment = await braintrust.init("gh-issue-titles", {
    experiment: "original-prompt",
  });

  let analyzeExperiment = async (
    titleGrades: { title: string; grade: string }[]
  ) => {
    for (let i = 0; i < issues.length; i++) {
      const { title, grade } = titleGrades[i];
      let valid = 1;
      let winner = 0;
      try {
        winner = parseBestTitle(grade) === 1 ? 1 : 0;
      } catch (e) {
        valid = 0;
      }

      experiment.log({
        inputs: { page_content: issues[i].page_content },
        output: title,
        expected: issues[i].metadata.title,
        metadata: { doc: issues[i].metadata, rationale: grade },
        scores: { winner, valid },
      });
    }

    console.log(await experiment.summarize());
  };
  await analyzeExperiment(titleGrades);

  issue = issues.find((e) => e.metadata.number == 4833);
  printSection(`Let's debug ${issue.metadata.url}`);
  console.log(issue.metadata.title);
  console.log("-".repeat(issue.metadata.title.length));
  console.log(issue.page_content);

  printSection("Fixing the prompt");
  createTitle = (pageContent: string): ChatCompletionRequestMessage[] => [
    {
      role: "system",
      content: `You are a technical project manager who helps software engineers generate better titles for their GitHub issues,
by looking at their issue descriptions. Make sure the title is accurate and comprehensive, over being concise.`,
    },
    {
      role: "user",
      content: pageContent,
    },
  ];

  const titleGrade = await evaluateIssue(issue);
  console.log(titleGrade.grade);
  console.log("Best Title: " + parseBestTitle(grade));

  printSection("Running across the dataset");
  titleGrades = await runOnAllIssues();
  experiment = await braintrust.init("gh-issue-titles", {
    experiment: "more-detailed-titles",
  });
  await analyzeExperiment(titleGrades);
}

function parseBestTitle(grade: string) {
  // return int(re.findall("Winner: (\d+)", grade["summary"])[0])
  return parseInt(grade.match(/Winner: (\d+)/)![1]);
}

async function loadIssues() {
  const repo_fname = REPO.replace("/", "-") + ".json";
  const repo_cache = CACHE_PATH + "/" + repo_fname;
  const repo_url = `https://braintrust-public.s3.amazonaws.com/${repo_fname}.gz`;

  if (!fs.existsSync(repo_cache)) {
    try {
      const { data } = await axios.get(repo_url, {
        responseType: "arraybuffer",
      });
      const unzipped = await util.promisify(zlib.gunzip)(data);
      fs.writeFileSync(repo_cache, unzipped);
    } catch (e) {
      console.log(
        `Failed to download ${repo_url}. This script does not yet loading issues from unknown repos.`
      );
      process.exit(1);
    }
  }

  let issues = fs
    .readFileSync(repo_cache, "utf8")
    .split("\n")
    .filter((x) => x.length > 0)
    .map((x) => JSON.parse(x));

  console.log(`Loaded ${issues.length} issues from ${REPO}`);

  issues.sort((a, b) => {
    return (
      new Date(a.metadata.created_at).getTime() -
      new Date(b.metadata.created_at).getTime()
    );
  });

  issues = issues.filter((d) => !d.metadata.is_pull_request).slice(0, N_ISSUES);

  return issues;
}

function printSection(sectionText: string) {
  console.log("");
  console.log("=".repeat(sectionText.length));
  console.log(sectionText);
  console.log("=".repeat(sectionText.length));
  console.log("");
}

const throttledInstance = throttledQueue(50, 1000, true);
const chatComplete = async (args: CreateChatCompletionRequest) => {
  return await throttledInstance(async () => {
    return await openai.createChatCompletion(args);
  });
};
/* Feel free to comment out this code if you do not want to cache openai requests */
const db = new sqlite3.Database(`${CACHE_PATH}/cache.db`);
db.run(`CREATE TABLE IF NOT EXISTS "cache" (params text, response text)`);
async function cachedChatCompletion(args: CreateChatCompletionRequest) {
  const param_key = JSON.stringify(args);
  const query = `SELECT response FROM "cache" WHERE params=?`;
  const resp = await new Promise((resolve, reject) => {
    db.get(query, [param_key], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
  if (resp) {
    return JSON.parse((resp as any).response);
  }

  const completion = await chatComplete(args);
  const data = completion.data;
  db.run(`INSERT INTO "cache" VALUES (?, ?)`, [
    param_key,
    JSON.stringify(data),
  ]);

  return data;
}
