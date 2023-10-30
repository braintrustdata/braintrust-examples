import { ChatCompletionMessage } from "openai/resources/index.mjs";
export const simpleQA = (content: string): ChatCompletionMessage[] => [
  {
    role: "assistant",
    content: `You are a help desk assistant for Coda.`,
  },
  {
    role: "user",
    content:
      `Please answer the following question:

Question: ` + content,
  },
];

export const ragQA = (
  content: string,
  contexts: string[]
): ChatCompletionMessage[] => [
  {
    role: "assistant",
    content: `You are a help desk assistant for Coda.`,
  },
  {
    role: "user",
    content: `Given the following context
      
${contexts.join("\n------\n")}
      
Please answer the following question:

Question: ${content}`,
  },
];
