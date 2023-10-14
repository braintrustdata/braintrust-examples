import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { ChatCompletionMessage } from "openai/resources/index.mjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export const titleGeneratorMessages = (
  title: string
): ChatCompletionMessage[] => [
  {
    role: "system",
    content: "Generate a new title based on the github issue",
  },
  {
    role: "user",
    content: "Github issue: " + title,
  },
];

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: titleGeneratorMessages(prompt),
    temperature: 0,
  });
  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
