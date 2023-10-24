import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { titleGeneratorMessages } from "@/util/prompts";

import { initLogger } from "braintrust";
import { chatCompletionStreaming } from "@/evals/oai";

const logger = initLogger({
  projectName: "gh-issues",
  apiUrl: process.env.BRAINTRUST_API_URL || undefined,
  apiKey: process.env.BRAINTRUST_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const response = await logger.traced(
    async (span) => {
      return chatCompletionStreaming(span, {
        model: "gpt-3.5-turbo",
        stream: true,
        messages: titleGeneratorMessages(prompt),
        temperature: 0,
      });
    },
    {
      event: {
        input: prompt,
      },
    }
  );

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
