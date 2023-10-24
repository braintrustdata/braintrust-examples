import { NoopSpan, Span, currentSpan } from "braintrust";
import OpenAI from "openai";
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsStreaming,
  CreateEmbeddingResponse,
  EmbeddingCreateParams,
  Embeddings,
} from "openai/resources/index.mjs";
import { Stream } from "openai/streaming.mjs";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatCompletion(
  params: Omit<ChatCompletionCreateParams, "stream">
): Promise<ChatCompletion> {
  return await (currentSpan() || new NoopSpan()).traced(
    "OpenAI Completion",
    async (span) => {
      const { messages, ...rest } = params;
      let i = 0;
      let ret: ChatCompletion | null = null;
      while (i < 10) {
        try {
          ret = (await Promise.race([
            openai.chat.completions.create(params),
            new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(new Error("Timeout"));
              }, 10000);
            }),
          ])) as ChatCompletion;
          break;
        } catch (e: any) {
          console.warn("Timeout, retrying...");
          i++;
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 1000)
          );
          continue;
        }
      }
      if (!ret) {
        throw new Error("Timeout (30s x 10)");
      }
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
    }
  );
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

export async function embedText(
  params: EmbeddingCreateParams
): Promise<CreateEmbeddingResponse> {
  return await (currentSpan() || new NoopSpan()).traced(
    "OpenAI Embedding",
    async (span) => {
      const response = await openai.embeddings.create(params);
      const { input, ...rest } = params;
      span.log({
        input,
        output: response.data[0].embedding,
        metadata: {
          ...rest,
        },
        metrics: {
          tokens: response.usage?.total_tokens,
          prompt_tokens: response.usage?.prompt_tokens,
        },
      });
      return response;
    }
  );
}
