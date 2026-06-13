import { describe, expect, it } from "vitest";
import { buildChatPrompt, buildSummaryPrompt } from "./buildChatPrompt";

describe("buildChatPrompt", () => {
  it("includes role, boundaries, retrieved material, and source-on-request rule", () => {
    const prompt = buildChatPrompt({
      mode: "doubt",
      conversationSummary: "用户关心 AI 是否会被资本用于剥削。",
      retrievedChunks: [
        {
          chunk: {
            id: "ai#0",
            sourceId: "why-ai",
            title: "为什么是 AI",
            tags: ["AI"],
            text: "AI 可能被用来提高监控和管理强度。",
            filePath: "/knowledge/why-ai.md",
          },
          score: 5,
        },
      ],
    });

    expect(prompt).toContain("你是“数据平权，AI 下乡”摊位的 AI 助手");
    expect(prompt).toContain("用户追问依据、来源、原文时，才说明材料来源");
    expect(prompt).toContain("当前入口模式：我有点怀疑");
    expect(prompt).toContain("为什么是 AI");
    expect(prompt).toContain("AI 可能被用来提高监控和管理强度");
  });
});

describe("buildSummaryPrompt", () => {
  it("forbids adding new project claims", () => {
    const prompt = buildSummaryPrompt([
      { id: "1", role: "user", content: "你们凭什么代表工友？" },
      { id: "2", role: "assistant", content: "项目不能声称已经代表工友。" },
    ]);

    expect(prompt).toContain("不要添加新观点");
    expect(prompt).toContain("不能补充知识库没有的项目立场");
  });
});
