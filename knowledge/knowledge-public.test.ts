import { describe, expect, it } from "vitest";
import { loadKnowledgeBase, loadKnowledgeChunks } from "@/lib/knowledge/loader";
import { retrieve } from "@/lib/knowledge/retriever";

describe("public knowledge base", () => {
  it("covers the public ideal material as concise approved topics", async () => {
    const docs = await loadKnowledgeBase();
    const ids = docs.map((doc) => doc.id);

    expect(ids).toEqual([
      "project-intro",
      "data-equality",
      "ai-to-the-people",
      "who-we-serve",
      "cattle-license",
      "self-restraint",
      "direction-map",
      "hard-questions",
      "event-positioning",
      "boundaries",
      "how-to-continue",
    ]);
  });

  it("keeps links from concise public topics back to source material", async () => {
    const docs = await loadKnowledgeBase();

    expect(docs.find((doc) => doc.id === "data-equality")?.sources).toContain("source-data-equality-manifesto");
    expect(docs.find((doc) => doc.id === "cattle-license")?.sources).toContain("source-cattle-license");
    expect(docs.find((doc) => doc.id === "direction-map")?.sources).toContain("source-direction-map-handout");
    expect(docs.find((doc) => doc.id === "direction-map")?.sources).toContain("source-7x7-capability-theory");
    expect(docs.find((doc) => doc.id === "event-positioning")?.sources).toContain("source-booth-conversation-notes");
  });

  it("keeps internal planning and event logistics out of public material", async () => {
    const docs = await loadKnowledgeBase();
    const publicText = docs.map((doc) => doc.content).join("\n");

    expect(publicText).not.toContain("内部用");
    expect(publicText).not.toContain("不外发");
    expect(publicText).not.toContain("缴费证明");
    expect(publicText).not.toContain("印刷下单");
    expect(publicText).not.toContain("联系方式留空");
    expect(publicText).not.toContain("腾讯表单二维码位");
  });

  it("retrieves the right public topic for common booth questions", async () => {
    const chunks = await loadKnowledgeChunks();

    expect(retrieve("牛马互助协议是不是 1/3 价", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe("cattle-license");
    expect(retrieve("7x7 矩阵到底是产品吗", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe("direction-map");
    expect(retrieve("这次摆摊到底图啥", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe("event-positioning");
  });

  it("retrieves approved source material for full-text and detailed-material questions", async () => {
    const chunks = await loadKnowledgeChunks();

    expect(retrieve("给我完整版数据平权宣言", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe(
      "source-data-equality-manifesto",
    );
    expect(retrieve("能不能给我牛马互助协议全文", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe(
      "source-cattle-license",
    );
    expect(retrieve("7x7 表格里 B3 建筑工欠薪是什么", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe(
      "source-direction-map-handout",
    );
    expect(retrieve("7x7 纵轴为什么按被剥夺的能力划分，能力进路和努斯鲍姆是什么", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe(
      "source-7x7-capability-theory",
    );
    expect(retrieve("生产和消费那张传单讲的空着的一格是什么", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe(
      "source-production-vs-consumption",
    );
    expect(retrieve("如果别人问我们是不是用户调研怎么回答", chunks, { limit: 1 })[0]?.chunk.sourceId).toBe(
      "source-booth-conversation-notes",
    );
  });
});
