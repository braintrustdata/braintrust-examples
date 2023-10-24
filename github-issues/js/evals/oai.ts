import { Span } from "braintrust";
import OpenAI from "openai";
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsStreaming,
} from "openai/resources/index.mjs";
import { Stream } from "openai/streaming.mjs";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatCompletion(
  span: Span,
  params: Omit<ChatCompletionCreateParams, "stream">
): Promise<ChatCompletion> {
  return await span.traced("OpenAI Completion", async (span) => {
    const { messages, ...rest } = params;
    const ret = await openai.chat.completions.create(params);
    span.log({
      input: messages,
      metadata: rest,
      output: ret.choices[0],
      metrics: {
        tokens: ret.usage?.total_tokens,
        prompt_tokens: ret.usage?.prompt_tokens,
        completion_tokens: ret.usage?.completion_tokens,
      },
    });
    return ret;
  });
}

export async function chatCompletionStreaming(
  span: Span,
  params: ChatCompletionCreateParamsStreaming
): Promise<Stream<ChatCompletionChunk>> {
  // TODO: We should wrap the stream with some metrics
  return await span.traced("OpenAI Completion", async (span) => {
    const { messages, ...rest } = params;
    const ret = await openai.chat.completions.create(params);
    span.log({
      input: messages,
      metadata: rest,
    });
    return ret;
  });
}
