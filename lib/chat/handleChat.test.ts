import { describe, expect, it, vi } from "vitest";
import { handleChat } from "./handleChat";

describe("handleChat", () => {
  it("returns an assistant answer from retrieved material", async () => {
    const callModel = vi.fn().mockResolvedValue("数据平权讨论普通用户产生的数据价值如何被看见和分配。");
    const response = await handleChat({
      body: {
        mode: "free",
        message: "数据平权是什么意思",
        messages: [],
        conversationSummary: "",
      },
      ip: "1.2.3.4",
      now: 0,
      callModel,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "数据平权讨论普通用户产生的数据价值如何被看见和分配。",
    });
    expect(callModel).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens: 700,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("项目介绍"),
          }),
          expect.objectContaining({
            role: "user",
            content: "数据平权是什么意思",
          }),
        ]),
      }),
    );
  });

  it("rejects overlong user input", async () => {
    const response = await handleChat({
      body: {
        mode: "free",
        message: "x".repeat(1001),
        messages: [],
        conversationSummary: "",
      },
      ip: "1.2.3.4",
      now: 0,
      callModel: vi.fn(),
    });

    expect(response.status).toBe(400);
  });

  it("returns a friendly fallback when knowledge loading fails", async () => {
    const response = await handleChat({
      body: {
        mode: "free",
        message: "数据平权是什么意思",
        messages: [],
        conversationSummary: "",
      },
      ip: "9.9.9.9",
      now: 0,
      callModel: vi.fn(),
      loadChunks: vi.fn().mockRejectedValue(new Error("missing knowledge")),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "网络可能有点不稳，可以重试一次。也可以直接回摊位找摊主问这个问题。",
    });
  });

  it("returns a friendly fallback when the model fails", async () => {
    const response = await handleChat({
      body: {
        mode: "free",
        message: "数据平权是什么意思",
        messages: [],
        conversationSummary: "",
      },
      ip: "8.8.8.8",
      now: 0,
      callModel: vi.fn().mockRejectedValue(new Error("model down")),
    });

    expect(response.status).toBe(502);
  });
});
