import { callDeepSeek, type DeepSeekMessage } from "@/lib/deepseek/client";
import { loadKnowledgeChunks } from "@/lib/knowledge/loader";
import { retrieve } from "@/lib/knowledge/retriever";
import { chatRateLimiter } from "@/lib/rateLimit";
import { chatRequestSchema } from "@/lib/validation";
import { buildChatPrompt } from "./buildChatPrompt";

type HandleChatInput = {
  body: unknown;
  ip: string;
  now?: number;
  callModel?: typeof callDeepSeek;
  loadChunks?: typeof loadKnowledgeChunks;
};

function wantsExpandedSourceAnswer(message: string) {
  return /全文|完整版|原文|完整|全部/.test(message);
}

export async function handleChat(input: HandleChatInput) {
  const limit = chatRateLimiter.check(input.ip, input.now);
  if (!limit.allowed) {
    return Response.json({ error: "请求有点太频繁了，可以稍等一下再试。" }, { status: 429 });
  }

  const parsed = chatRequestSchema.safeParse(input.body);
  if (!parsed.success) {
    return Response.json({ error: "问题太长或格式不对，可以缩短一点再问。" }, { status: 400 });
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const chunks = await (input.loadChunks ?? loadKnowledgeChunks)();
    const shouldExpandSourceAnswer = wantsExpandedSourceAnswer(parsed.data.message);
    const retrievedChunks = retrieve(
      `${parsed.data.message}\n${parsed.data.conversationSummary}\n${parsed.data.messages
        .map((message) => message.content)
        .join("\n")}`,
      chunks,
      { limit: shouldExpandSourceAnswer ? 12 : 6, minimumScore: 1 },
    );

    const system = buildChatPrompt({
      mode: parsed.data.mode,
      conversationSummary: parsed.data.conversationSummary,
      retrievedChunks,
    });

    const messages: DeepSeekMessage[] = [
      { role: "system", content: system },
      ...parsed.data.messages.map((message) => ({ role: message.role, content: message.content })),
      { role: "user", content: parsed.data.message },
    ];

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 20_000);
    const answer = await (input.callModel ?? callDeepSeek)({
      messages,
      maxTokens: shouldExpandSourceAnswer ? 1200 : 700,
      signal: controller.signal,
    });

    return Response.json({ answer });
  } catch {
    return Response.json(
      { error: "网络可能有点不稳，可以重试一次。也可以直接回摊位找摊主问这个问题。" },
      { status: 502 },
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
