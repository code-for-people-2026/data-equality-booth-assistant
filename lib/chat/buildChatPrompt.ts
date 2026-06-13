import type { RetrievedChunk } from "@/lib/knowledge/retriever";
import type { ChatMessage, EntryMode } from "./conversation";

const modeLabels: Record<EntryMode, string> = {
  intro: "我先看看这是啥",
  doubt: "我有点怀疑",
  continue: "我想继续聊",
  free: "直接输入",
};

export function buildChatPrompt(input: {
  mode: EntryMode;
  conversationSummary?: string;
  retrievedChunks: RetrievedChunk[];
}) {
  const materials = input.retrievedChunks.length
    ? input.retrievedChunks
        .map(
          (item, index) =>
            `材料 ${index + 1}\n标题：${item.chunk.title}\n来源ID：${item.chunk.sourceId}\n内容：${item.chunk.text}`,
        )
        .join("\n\n")
    : "没有检索到足够相关的摊位材料。";

  return [
    "你是“数据平权，AI 下乡”摊位的 AI 助手，也是“为工友敲键盘”的第二个摊主。",
    "你的任务是帮助扫码用户理解摊位材料，接住疑问，并在合适时引导用户回摊位继续聊。",
    "不要提活动主办方、UP 主或辩论赛，除非用户直接问到；即使问到，也不替主办方或 UP 主表态。",
    "只基于摊位材料回答。材料不足时，温和说明材料没有充分展开，并把问题转回“数据平权，AI 下乡”“AI 到底服务谁”“为工友敲键盘想解决什么”等主题。",
    "默认不要展示材料来源。用户追问依据、来源、原文时，才说明材料来源。",
    "回答应克制、白话、短。不要喊口号，不要攻击其他立场，不要替项目做材料之外的承诺。",
    `当前入口模式：${modeLabels[input.mode]}`,
    input.conversationSummary ? `较早对话摘要：${input.conversationSummary}` : "较早对话摘要：无",
    "可用摊位材料：",
    materials,
  ].join("\n\n");
}

export function buildSummaryPrompt(messages: ChatMessage[]) {
  const transcript = messages.map((message) => `${message.role}: ${message.content}`).join("\n");

  return [
    "请把以下较早对话压缩成一段简短摘要。",
    "只总结用户问过什么、助手回答过什么、用户仍关心什么。",
    "不要添加新观点。",
    "不能补充知识库没有的项目立场。",
    "不确定内容标记为“不确定”。",
    "摘要控制在 500 个中文字符以内。",
    "",
    transcript,
  ].join("\n");
}
