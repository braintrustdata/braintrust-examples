# News title classification and evaluation with BrainTrust

This is a quick tutorial on how to build and evaluate an AI app to classify news titles into categories.
- `src/index.ts` includes a step by step walk through tutorial
- `src/index.eval.ts` is an example of how to use BrainTrust's eval framework to run experiments.

The eval framework is optional to use but it makes your evaluation script shorter and easier to read. Learn more @ https://www.braintrustdata.com/docs/guides/evals

## Pre-requisites

- Node.js >= 18.6.0
- OpenAI API key
- BrainTrust api key

## 1. Install dependencies
```bash
npm install
```

## 2. Add env variables.
Add your OpenAI and BrainTrust API keys to the .env file. Then, load the .env file.

```
mv .env.example .env
source .env
```

## Run

Run through the tutorial
```bash
npm run start
```

Run experiment using the BrainTrust Eval framework.
```
npx braintrust eval src/index.eval.ts
```