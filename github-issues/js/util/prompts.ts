import { ChatCompletionMessage } from "openai/resources/index.mjs";
export const titleGeneratorMessages = (
  content: string
): ChatCompletionMessage[] => [
  {
    role: "system",
    content: "Generate a new title based on the github issue",
  },
  {
    role: "user",
    content: "Github issue: " + content,
  },
];
