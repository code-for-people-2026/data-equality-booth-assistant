import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadKnowledgeBase, loadKnowledgeChunks, splitIntoChunks } from "./loader";

const fixtureDir = path.join(process.cwd(), "test/fixtures/knowledge");

describe("loadKnowledgeBase", () => {
  it("loads only public approved markdown files", async () => {
    const docs = await loadKnowledgeBase(fixtureDir);

    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      id: "approved",
      title: "Approved Material",
      visibility: "public",
      status: "approved",
      tags: ["数据平权", "AI 下乡"],
    });
    expect(docs[0]?.content).toContain("数据平权强调");
  });
});

describe("splitIntoChunks", () => {
  it("preserves source metadata and repeats heading context for each paragraph chunk", () => {
    const chunks = splitIntoChunks({
      id: "approved",
      title: "Approved Material",
      visibility: "public",
      status: "approved",
      tags: ["数据平权"],
      content: "## 核心说明\n\n第一段内容。\n\n第二段内容。",
      filePath: "/tmp/approved.md",
    });

    expect(chunks).toEqual([
      expect.objectContaining({
        id: "approved#0",
        sourceId: "approved",
        title: "Approved Material",
        tags: ["数据平权"],
        text: "核心说明\n\n第一段内容。",
        filePath: "/tmp/approved.md",
      }),
      expect.objectContaining({
        id: "approved#1",
        sourceId: "approved",
        title: "Approved Material",
        tags: ["数据平权"],
        text: "核心说明\n\n第二段内容。",
        filePath: "/tmp/approved.md",
      }),
    ]);
  });
});

describe("loadKnowledgeChunks", () => {
  it("loads approved material and returns chunked content", async () => {
    const chunks = await loadKnowledgeChunks(fixtureDir);

    expect(chunks).toEqual([
      expect.objectContaining({
        id: "approved#0",
        sourceId: "approved",
        title: "Approved Material",
        tags: ["数据平权", "AI 下乡"],
        text: expect.stringContaining("数据平权强调"),
        filePath: expect.stringContaining("approved.md"),
      }),
      expect.objectContaining({
        id: "approved#1",
        sourceId: "approved",
        title: "Approved Material",
        tags: ["数据平权", "AI 下乡"],
        text: expect.stringContaining("如果想继续聊"),
        filePath: expect.stringContaining("approved.md"),
      }),
    ]);
  });
});
