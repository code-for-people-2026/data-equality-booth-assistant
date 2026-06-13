# Booth AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-off mobile-first H5 booth assistant for “数据平权，AI 下乡” that answers from approved booth materials through a DeepSeek-backed Next.js app.

**Architecture:** Use a single Next.js App Router project with client-side chat state and server-side route handlers for `/api/chat` and `/api/summarize`. Keep the RAG boundary behind a `retrieve()` interface so simple keyword retrieval can be replaced by vector retrieval without changing API or UI code.

**Tech Stack:** Next.js App Router, React, TypeScript, pnpm, Vitest, Testing Library, Zod, gray-matter, lucide-react, DeepSeek OpenAI-compatible Chat Completions API.

---

## References Checked

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- DeepSeek API quick start and OpenAI-compatible Chat API: https://api-docs.deepseek.com/

## File Structure

Create this structure:

```text
.
├── app/
│   ├── api/
│   │   ├── chat/route.ts
│   │   └── summarize/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ChatComposer.tsx
│   ├── ChatMessage.tsx
│   ├── ContinuePanel.tsx
│   ├── EntryScreen.tsx
│   └── StatusNotice.tsx
├── knowledge/
│   ├── policy/
│   │   ├── answer-style.md
│   │   └── refusal-and-redirect.md
│   └── public/
│       ├── 001-project-intro.md
│       ├── 002-why-ai.md
│       ├── 003-who-we-serve.md
│       ├── 004-boundaries.md
│       ├── 005-hard-questions.md
│       └── 006-how-to-continue.md
├── lib/
│   ├── chat/
│   │   ├── buildChatPrompt.ts
│   │   ├── buildChatPrompt.test.ts
│   │   ├── conversation.ts
│   │   ├── conversation.test.ts
│   │   ├── handleChat.ts
│   │   ├── handleChat.test.ts
│   │   ├── handleSummarize.ts
│   │   └── handleSummarize.test.ts
│   ├── deepseek/
│   │   ├── client.ts
│   │   └── client.test.ts
│   ├── knowledge/
│   │   ├── loader.ts
│   │   ├── loader.test.ts
│   │   ├── retriever.ts
│   │   └── retriever.test.ts
│   ├── rateLimit.ts
│   ├── rateLimit.test.ts
│   └── validation.ts
├── test/
│   ├── setup.ts
│   └── fixtures/knowledge/
│       ├── approved.md
│       ├── draft.md
│       └── private.md
├── docs/
│   ├── deployment.md
│   ├── manual-test-cases.md
│   └── superpowers/
│       ├── plans/2026-06-13-booth-ai-assistant-implementation.md
│       └── specs/2026-06-13-booth-ai-assistant-design.md
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── vitest.setup.ts
```

Responsibilities:

- `app/page.tsx`: client-side chat app shell and browser-memory state.
- `components/*`: focused presentational components for entry, messages, composer, status, and continue panel.
- `lib/knowledge/*`: load approved public Markdown and retrieve relevant chunks.
- `lib/chat/*`: validate chat inputs, build prompts, apply conversation summary rules, and implement testable API handlers.
- `lib/deepseek/client.ts`: one DeepSeek HTTP client wrapper.
- `lib/rateLimit.ts`: in-memory IP limiter for one-off serverless/local deployment.
- `app/api/*/route.ts`: thin route handlers that call testable functions.
- `knowledge/*`: initial approved sample materials that make the app runnable before the final curated knowledge base is ready.

## Task 1: Scaffold Next.js App And Test Harness

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `test/setup.ts`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Scaffold the app**

Run:

```bash
pnpm create next-app@latest . \
  --ts \
  --eslint \
  --app \
  --src-dir false \
  --no-tailwind \
  --import-alias "@/*" \
  --use-pnpm
```

Expected:

```text
The command creates a Next.js App Router project in the repository root.
```

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```bash
pnpm add gray-matter zod lucide-react
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react tsx
```

Expected:

```text
Dependencies are added to package.json and pnpm-lock.yaml.
```

- [ ] **Step 3: Replace `package.json` scripts**

Ensure `package.json` contains these scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "typecheck": "tsc --noEmit"
  }
}
```

Run:

```bash
pnpm test -- --passWithNoTests
```

Expected:

```text
No test files found
```

- [ ] **Step 4: Configure Vitest**

Replace `vitest.config.ts` with:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `test/setup.ts`:

```ts
export function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
```

- [ ] **Step 5: Create environment example**

Create `.env.example`:

```text
DEEPSEEK_API_KEY=replace-with-your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
CHAT_RATE_LIMIT_PER_MINUTE=10
CHAT_RATE_LIMIT_PER_HOUR=100
```

- [ ] **Step 6: Run scaffold verification**

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
git status --short
```

Expected:

```text
typecheck passes
tests pass
Next.js build succeeds
new scaffold files are listed
```

- [ ] **Step 7: Commit scaffold**

Run:

```bash
git add .
git commit -m "chore: scaffold booth assistant app"
```

Expected:

```text
A commit is created for the app scaffold.
```

## Task 2: Knowledge Base Loader

**Files:**
- Create: `test/fixtures/knowledge/approved.md`
- Create: `test/fixtures/knowledge/draft.md`
- Create: `test/fixtures/knowledge/private.md`
- Create: `lib/knowledge/loader.test.ts`
- Create: `lib/knowledge/loader.ts`
- Create: `knowledge/public/001-project-intro.md`
- Create: `knowledge/public/002-why-ai.md`
- Create: `knowledge/public/003-who-we-serve.md`
- Create: `knowledge/public/004-boundaries.md`
- Create: `knowledge/public/005-hard-questions.md`
- Create: `knowledge/public/006-how-to-continue.md`
- Create: `knowledge/policy/answer-style.md`
- Create: `knowledge/policy/refusal-and-redirect.md`

- [ ] **Step 1: Create fixture Markdown files**

Create `test/fixtures/knowledge/approved.md`:

```md
---
id: approved
title: Approved Material
visibility: public
status: approved
tags:
  - 数据平权
  - AI 下乡
---

## 核心说明

数据平权强调普通用户产生的数据价值不应只被平台占有。

## 继续了解

如果想继续聊，可以回到摊位找摊主。
```

Create `test/fixtures/knowledge/draft.md`:

```md
---
id: draft
title: Draft Material
visibility: public
status: draft
tags:
  - 草稿
---

这段内容不应该被加载。
```

Create `test/fixtures/knowledge/private.md`:

```md
---
id: private
title: Private Material
visibility: private
status: approved
tags:
  - 内部
---

这段内部内容不应该被加载。
```

- [ ] **Step 2: Write failing loader tests**

Create `lib/knowledge/loader.test.ts`:

```ts
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadKnowledgeBase, splitIntoChunks } from "./loader";

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
    expect(docs[0].content).toContain("数据平权强调");
  });
});

describe("splitIntoChunks", () => {
  it("preserves source metadata while splitting on headings and paragraphs", () => {
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
        text: "核心说明\n\n第一段内容。",
      }),
      expect.objectContaining({
        id: "approved#1",
        sourceId: "approved",
        title: "Approved Material",
        text: "第二段内容。",
      }),
    ]);
  });
});
```

- [ ] **Step 3: Run loader tests and verify failure**

Run:

```bash
pnpm test lib/knowledge/loader.test.ts
```

Expected:

```text
FAIL because lib/knowledge/loader.ts does not exist
```

- [ ] **Step 4: Implement knowledge loader**

Create `lib/knowledge/loader.ts`:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const metadataSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  visibility: z.literal("public"),
  status: z.literal("approved"),
  tags: z.array(z.string()).default([]),
});

export type KnowledgeDocument = z.infer<typeof metadataSchema> & {
  content: string;
  filePath: string;
};

export type KnowledgeChunk = {
  id: string;
  sourceId: string;
  title: string;
  tags: string[];
  text: string;
  filePath: string;
};

async function listMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listMarkdownFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".md")) return [fullPath];
      return [];
    }),
  );
  return files.flat().sort();
}

export async function loadKnowledgeBase(rootDir = path.join(process.cwd(), "knowledge/public")) {
  const files = await listMarkdownFiles(rootDir);
  const documents: KnowledgeDocument[] = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = matter(raw);
    const metadata = metadataSchema.safeParse(parsed.data);

    if (!metadata.success) continue;

    documents.push({
      ...metadata.data,
      content: parsed.content.trim(),
      filePath,
    });
  }

  return documents;
}

export function splitIntoChunks(document: KnowledgeDocument): KnowledgeChunk[] {
  const normalized = document.content
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();

  const chunks = normalized
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `${document.id}#${index}`,
      sourceId: document.id,
      title: document.title,
      tags: document.tags,
      text,
      filePath: document.filePath,
    }));

  return chunks;
}

export async function loadKnowledgeChunks(rootDir = path.join(process.cwd(), "knowledge/public")) {
  const documents = await loadKnowledgeBase(rootDir);
  return documents.flatMap(splitIntoChunks);
}
```

- [ ] **Step 5: Create initial approved knowledge files**

Create `knowledge/public/001-project-intro.md`:

```md
---
id: project-intro
title: 项目介绍
visibility: public
status: approved
tags:
  - 数据平权
  - AI 下乡
  - 为工友敲键盘
---

## 这是什么

“数据平权，AI 下乡”是这次摊位的主题。它想讨论的是：AI 时代的软件和数据能力，能不能不只服务平台和公司，也认真服务普通劳动者。

“为工友敲键盘”现在不是一个成熟组织，更像一个早期项目：整理理念、寻找同路人、尝试做一些真正对工友有用的软件和 AI 工具。

## 现在做到哪一步

当前阶段以理念整理、摊位沟通和小规模产品验证为主。它不声称已经解决了组织、资金、治理和技术主权问题。
```

Create `knowledge/public/002-why-ai.md`:

```md
---
id: why-ai
title: 为什么是 AI
visibility: public
status: approved
tags:
  - AI
  - 软件
  - 数据平权
---

## 为什么谈 AI

AI 正在改变软件生产的成本结构。更小的团队有机会做过去更大团队才能做的软件，这给“服务小众但真实的人群”留下了空间。

风险也很真实：AI 可能被用来提高监控、管理和压榨效率。因此关键问题不是“AI 好不好”，而是“AI 被谁掌握、为谁服务、服务结果由谁受益”。
```

Create `knowledge/public/003-who-we-serve.md`:

```md
---
id: who-we-serve
title: 服务谁
visibility: public
status: approved
tags:
  - 工友
  - 服务对象
  - 普通劳动者
---

## 工友是什么意思

这里说的“工友”不是只按行业划分。它更强调人在生产关系中的位置：不占有平台、数据与算法，主要靠出卖劳动、接单、经营小生意或承担无偿照护来维持生活的人。

这个项目不会声称替工友发言。更准确地说，它想从工友处境出发，做出能被真实使用、能被真实检验的工具。
```

Create `knowledge/public/004-boundaries.md`:

```md
---
id: boundaries
title: 边界声明
visibility: public
status: approved
tags:
  - 边界
  - 不是什么
  - 风险
---

## 不是什么

这个摊位不是活动主办方的一部分，也不代表任何 UP 主或组织。

这个项目不是已经成熟的公益机构，不是政治组织，也不是一个已经上线的大型产品。它是一次早期表达和行动方向的公开尝试。

## 不做什么承诺

它不承诺已经代表工友，不承诺已经解决组织退化风险，也不承诺 AI 天然会站在劳动者一边。相反，这些都是项目必须持续面对的问题。
```

Create `knowledge/public/005-hard-questions.md`:

```md
---
id: hard-questions
title: 尖锐问题回应
visibility: public
status: approved
tags:
  - 质疑
  - 中产自我感动
  - 剥削
  - 组织退化
---

## 这是不是中产自我感动

这是一个必须认真对待的问题。项目不能只靠善意证明自己。它需要通过真实接触、真实需求、真实产品和真实反馈来检验。

比较诚实的说法是：现在它还在早期，不能宣称已经代表工友。它只能承认自己的出发点、暴露自己的风险，并接受后续实践检验。

## AI 会不会只是资本的新工具

会，这个风险已经在发生。很多平台和公司会用 AI 提高效率、监控和管理强度。

这个项目的出发点不是说 AI 天然进步，而是说 AI 的能力不应该只被平台和资本使用。关键是让普通劳动者也能接近、理解和使用这些能力。
```

Create `knowledge/public/006-how-to-continue.md`:

```md
---
id: how-to-continue
title: 如何继续了解
visibility: public
status: approved
tags:
  - 继续了解
  - 摊位
  - 联系方式
---

## 继续聊

如果你对这个项目有兴趣，可以等摊主空下来直接聊。你也可以先把问题问 AI，让 AI 帮你整理成更适合现场继续聊的问题。

官网、文档和联系方式会放在页面的“继续了解”区域里。默认不会打断你的对话，只有你主动打开或明确询问时才会出现。
```

Create `knowledge/policy/answer-style.md`:

```md
# 回答风格

默认克制、清楚、白话。不要喊口号，不要主动攻击其他立场，不要替项目做材料之外的承诺。

回答先短后长。默认 2-5 段，用户追问后再展开。
```

Create `knowledge/policy/refusal-and-redirect.md`:

```md
# 越界转向

当问题超出摊位材料范围时，先说明材料没有充分展开，再把问题转回“数据平权，AI 下乡”“AI 到底服务谁”“为工友敲键盘想解决什么”等相关主题。
```

- [ ] **Step 6: Run loader verification**

Run:

```bash
pnpm test lib/knowledge/loader.test.ts
pnpm typecheck
```

Expected:

```text
loader tests pass
typecheck passes
```

- [ ] **Step 7: Commit knowledge loader**

Run:

```bash
git add lib/knowledge test/fixtures knowledge
git commit -m "feat: add approved knowledge loader"
```

Expected:

```text
A commit is created for knowledge loading.
```

## Task 3: Simple Retriever

**Files:**
- Create: `lib/knowledge/retriever.test.ts`
- Create: `lib/knowledge/retriever.ts`

- [ ] **Step 1: Write failing retriever tests**

Create `lib/knowledge/retriever.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { KnowledgeChunk } from "./loader";
import { retrieve } from "./retriever";

const chunks: KnowledgeChunk[] = [
  {
    id: "intro#0",
    sourceId: "intro",
    title: "项目介绍",
    tags: ["数据平权"],
    text: "数据平权讨论普通用户产生的数据价值不应只被平台占有。",
    filePath: "/knowledge/intro.md",
  },
  {
    id: "ai#0",
    sourceId: "ai",
    title: "为什么是 AI",
    tags: ["AI"],
    text: "AI 可能被用来提高监控和管理强度，关键是 AI 被谁掌握、为谁服务。",
    filePath: "/knowledge/ai.md",
  },
  {
    id: "contact#0",
    sourceId: "contact",
    title: "如何继续了解",
    tags: ["继续了解"],
    text: "如果想继续聊，可以等摊主空下来直接聊，也可以打开继续了解区域。",
    filePath: "/knowledge/contact.md",
  },
];

describe("retrieve", () => {
  it("returns chunks ranked by Chinese keyword overlap", () => {
    const results = retrieve("AI 会不会变成资本提高剥削效率的工具", chunks, { limit: 2 });

    expect(results.map((item) => item.chunk.id)).toEqual(["ai#0", "intro#0"]);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it("returns contact material when user asks how to continue", () => {
    const results = retrieve("怎么联系你们，后续怎么继续聊", chunks, { limit: 1 });

    expect(results[0].chunk.id).toBe("contact#0");
  });

  it("returns an empty list when there is no useful overlap", () => {
    const results = retrieve("今天晚饭吃什么", chunks, { limit: 3, minimumScore: 2 });

    expect(results).toEqual([]);
  });
});
```

- [ ] **Step 2: Run retriever tests and verify failure**

Run:

```bash
pnpm test lib/knowledge/retriever.test.ts
```

Expected:

```text
FAIL because lib/knowledge/retriever.ts does not exist
```

- [ ] **Step 3: Implement simple retriever**

Create `lib/knowledge/retriever.ts`:

```ts
import type { KnowledgeChunk } from "./loader";

export type RetrievedChunk = {
  chunk: KnowledgeChunk;
  score: number;
};

export type RetrieveOptions = {
  limit?: number;
  minimumScore?: number;
};

const stopwords = new Set([
  "这个",
  "那个",
  "什么",
  "怎么",
  "为什么",
  "你们",
  "我们",
  "他们",
  "是不是",
  "有没有",
  "一下",
  "可以",
  "的",
  "了",
  "和",
  "是",
  "在",
]);

function tokenize(input: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^\p{Script=Han}\p{Letter}\p{Number}]+/gu, " ");

  const asciiTokens = normalized.match(/[a-z0-9]{2,}/g) ?? [];
  const chineseTokens = normalized.match(/\p{Script=Han}{2,}/gu) ?? [];
  const bigrams = chineseTokens.flatMap((token) => {
    const result: string[] = [];
    for (let index = 0; index < token.length - 1; index += 1) {
      result.push(token.slice(index, index + 2));
    }
    return result;
  });

  return [...asciiTokens, ...chineseTokens, ...bigrams].filter((token) => !stopwords.has(token));
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk) {
  const haystack = `${chunk.title}\n${chunk.tags.join(" ")}\n${chunk.text}`.toLowerCase();
  return queryTokens.reduce((score, token) => {
    if (!haystack.includes(token)) return score;
    const tagBoost = chunk.tags.some((tag) => tag.toLowerCase().includes(token)) ? 2 : 0;
    const titleBoost = chunk.title.toLowerCase().includes(token) ? 2 : 0;
    return score + 1 + tagBoost + titleBoost;
  }, 0);
}

export function retrieve(query: string, chunks: KnowledgeChunk[], options: RetrieveOptions = {}) {
  const limit = options.limit ?? 6;
  const minimumScore = options.minimumScore ?? 1;
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) return [];

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(queryTokens, chunk) }))
    .filter((item) => item.score >= minimumScore)
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, limit);
}
```

- [ ] **Step 4: Run retriever verification**

Run:

```bash
pnpm test lib/knowledge/retriever.test.ts
pnpm typecheck
```

Expected:

```text
retriever tests pass
typecheck passes
```

- [ ] **Step 5: Commit retriever**

Run:

```bash
git add lib/knowledge/retriever.ts lib/knowledge/retriever.test.ts
git commit -m "feat: add simple knowledge retriever"
```

Expected:

```text
A commit is created for simple retrieval.
```

## Task 4: Conversation, Prompt, DeepSeek Client, And Rate Limit

**Files:**
- Create: `lib/chat/conversation.test.ts`
- Create: `lib/chat/conversation.ts`
- Create: `lib/chat/buildChatPrompt.test.ts`
- Create: `lib/chat/buildChatPrompt.ts`
- Create: `lib/deepseek/client.test.ts`
- Create: `lib/deepseek/client.ts`
- Create: `lib/rateLimit.test.ts`
- Create: `lib/rateLimit.ts`
- Create: `lib/validation.ts`

- [ ] **Step 1: Write conversation tests**

Create `lib/chat/conversation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compactMessagesForRequest, shouldSummarize } from "./conversation";

describe("compactMessagesForRequest", () => {
  it("keeps the latest four turns and drops older messages", () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `message ${index}`,
    }));

    expect(compactMessagesForRequest(messages).map((item) => item.content)).toEqual([
      "message 4",
      "message 5",
      "message 6",
      "message 7",
      "message 8",
      "message 9",
      "message 10",
      "message 11",
    ]);
  });
});

describe("shouldSummarize", () => {
  it("starts summary generation after ten messages", () => {
    expect(shouldSummarize(Array.from({ length: 9 }, (_, index) => ({ id: String(index), role: "user" as const, content: "x" })))).toBe(false);
    expect(shouldSummarize(Array.from({ length: 10 }, (_, index) => ({ id: String(index), role: "user" as const, content: "x" })))).toBe(true);
  });
});
```

- [ ] **Step 2: Implement conversation helpers**

Create `lib/chat/conversation.ts`:

```ts
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type EntryMode = "intro" | "doubt" | "continue" | "free";

export function compactMessagesForRequest(messages: ChatMessage[], maxMessages = 8) {
  return messages.slice(Math.max(0, messages.length - maxMessages));
}

export function shouldSummarize(messages: ChatMessage[], threshold = 10) {
  return messages.length >= threshold;
}

export function messagesForSummary(messages: ChatMessage[], keepRecent = 4) {
  return messages.slice(0, Math.max(0, messages.length - keepRecent));
}

export function recentMessagesAfterSummary(messages: ChatMessage[], keepRecent = 6) {
  return messages.slice(Math.max(0, messages.length - keepRecent));
}
```

- [ ] **Step 3: Write prompt builder tests**

Create `lib/chat/buildChatPrompt.test.ts`:

```ts
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
```

- [ ] **Step 4: Implement prompt builder**

Create `lib/chat/buildChatPrompt.ts`:

```ts
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
```

- [ ] **Step 5: Write DeepSeek client tests**

Create `lib/deepseek/client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { callDeepSeek } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("callDeepSeek", () => {
  it("sends an OpenAI-compatible chat completion request", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    vi.stubEnv("DEEPSEEK_BASE_URL", "https://api.deepseek.com");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-chat");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "回答内容" } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await callDeepSeek({
      messages: [
        { role: "system", content: "system" },
        { role: "user", content: "hello" },
      ],
      maxTokens: 300,
    });

    expect(result).toBe("回答内容");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer test-key",
          "content-type": "application/json",
        }),
      }),
    );
  });
});
```

- [ ] **Step 6: Implement DeepSeek client**

Create `lib/deepseek/client.ts`:

```ts
export type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callDeepSeek(input: {
  messages: DeepSeekMessage[];
  maxTokens: number;
  signal?: AbortSignal;
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: input.messages,
      max_tokens: input.maxTokens,
      temperature: 0.3,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek request failed: ${response.status} ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("DeepSeek returned an empty response");
  return content;
}
```

- [ ] **Step 7: Write rate limiter tests**

Create `lib/rateLimit.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows requests within limits and rejects later requests", () => {
    const limiter = createRateLimiter({ perMinute: 2, perHour: 3 });

    expect(limiter.check("1.2.3.4", 0).allowed).toBe(true);
    expect(limiter.check("1.2.3.4", 1).allowed).toBe(true);
    expect(limiter.check("1.2.3.4", 2).allowed).toBe(false);
  });

  it("separates clients by IP", () => {
    const limiter = createRateLimiter({ perMinute: 1, perHour: 1 });

    expect(limiter.check("1.2.3.4", 0).allowed).toBe(true);
    expect(limiter.check("5.6.7.8", 0).allowed).toBe(true);
  });
});
```

- [ ] **Step 8: Implement rate limiter and validation schemas**

Create `lib/rateLimit.ts`:

```ts
type RateLimitConfig = {
  perMinute: number;
  perHour: number;
};

type Bucket = {
  minute: number[];
  hour: number[];
};

export function createRateLimiter(config: RateLimitConfig) {
  const buckets = new Map<string, Bucket>();

  return {
    check(ip: string, now = Date.now()) {
      const bucket = buckets.get(ip) ?? { minute: [], hour: [] };
      bucket.minute = bucket.minute.filter((timestamp) => now - timestamp < 60_000);
      bucket.hour = bucket.hour.filter((timestamp) => now - timestamp < 3_600_000);

      if (bucket.minute.length >= config.perMinute || bucket.hour.length >= config.perHour) {
        buckets.set(ip, bucket);
        return { allowed: false, retryAfterSeconds: 60 };
      }

      bucket.minute.push(now);
      bucket.hour.push(now);
      buckets.set(ip, bucket);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export const chatRateLimiter = createRateLimiter({
  perMinute: Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE ?? 10),
  perHour: Number(process.env.CHAT_RATE_LIMIT_PER_HOUR ?? 100),
});
```

Create `lib/validation.ts`:

```ts
import { z } from "zod";

export const chatMessageSchema = z.object({
  id: z.string().min(1).max(80),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2_000),
});

export const chatRequestSchema = z.object({
  mode: z.enum(["intro", "doubt", "continue", "free"]),
  message: z.string().min(1).max(1_000),
  messages: z.array(chatMessageSchema).max(8),
  conversationSummary: z.string().max(800).optional().default(""),
});

export const summarizeRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(12),
  previousSummary: z.string().max(800).optional().default(""),
});
```

- [ ] **Step 9: Run prompt/client/rate verification**

Run:

```bash
pnpm test lib/chat/conversation.test.ts lib/chat/buildChatPrompt.test.ts lib/deepseek/client.test.ts lib/rateLimit.test.ts
pnpm typecheck
```

Expected:

```text
all tests pass
typecheck passes
```

- [ ] **Step 10: Commit shared chat infrastructure**

Run:

```bash
git add lib/chat lib/deepseek lib/rateLimit.ts lib/rateLimit.test.ts lib/validation.ts
git commit -m "feat: add chat prompt and DeepSeek infrastructure"
```

Expected:

```text
A commit is created for chat infrastructure.
```

## Task 5: Chat And Summarize API Handlers

**Files:**
- Create: `lib/chat/handleChat.test.ts`
- Create: `lib/chat/handleChat.ts`
- Create: `lib/chat/handleSummarize.test.ts`
- Create: `lib/chat/handleSummarize.ts`
- Create: `app/api/chat/route.ts`
- Create: `app/api/summarize/route.ts`

- [ ] **Step 1: Write chat handler tests**

Create `lib/chat/handleChat.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { handleChat } from "./handleChat";

describe("handleChat", () => {
  it("returns an assistant answer from retrieved material", async () => {
    const response = await handleChat({
      body: {
        mode: "free",
        message: "数据平权是什么意思",
        messages: [],
        conversationSummary: "",
      },
      ip: "1.2.3.4",
      now: 0,
      callModel: vi.fn().mockResolvedValue("数据平权讨论普通用户产生的数据价值如何被看见和分配。"),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "数据平权讨论普通用户产生的数据价值如何被看见和分配。",
    });
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
});
```

- [ ] **Step 2: Implement chat handler**

Create `lib/chat/handleChat.ts`:

```ts
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
};

export async function handleChat(input: HandleChatInput) {
  const limit = chatRateLimiter.check(input.ip, input.now);
  if (!limit.allowed) {
    return Response.json({ error: "请求有点太频繁了，可以稍等一下再试。" }, { status: 429 });
  }

  const parsed = chatRequestSchema.safeParse(input.body);
  if (!parsed.success) {
    return Response.json({ error: "问题太长或格式不对，可以缩短一点再问。" }, { status: 400 });
  }

  const chunks = await loadKnowledgeChunks();
  const retrievedChunks = retrieve(
    `${parsed.data.message}\n${parsed.data.conversationSummary}\n${parsed.data.messages.map((message) => message.content).join("\n")}`,
    chunks,
    { limit: 6, minimumScore: 1 },
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

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const answer = await (input.callModel ?? callDeepSeek)({
      messages,
      maxTokens: 700,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return Response.json({ answer });
  } catch {
    return Response.json(
      { error: "网络可能有点不稳，可以重试一次。也可以直接回摊位找摊主问这个问题。" },
      { status: 502 },
    );
  }
}
```

- [ ] **Step 3: Write summarize handler tests**

Create `lib/chat/handleSummarize.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { handleSummarize } from "./handleSummarize";

describe("handleSummarize", () => {
  it("returns an updated conversation summary", async () => {
    const response = await handleSummarize({
      body: {
        previousSummary: "",
        messages: [
          { id: "1", role: "user", content: "AI 会不会变成剥削工具？" },
          { id: "2", role: "assistant", content: "这个风险真实存在。" },
        ],
      },
      ip: "1.2.3.4",
      now: 0,
      callModel: vi.fn().mockResolvedValue("用户关心 AI 是否会被用于剥削；助手承认风险真实存在。"),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      summary: "用户关心 AI 是否会被用于剥削；助手承认风险真实存在。",
    });
  });
});
```

- [ ] **Step 4: Implement summarize handler**

Create `lib/chat/handleSummarize.ts`:

```ts
import { callDeepSeek, type DeepSeekMessage } from "@/lib/deepseek/client";
import { chatRateLimiter } from "@/lib/rateLimit";
import { summarizeRequestSchema } from "@/lib/validation";
import { buildSummaryPrompt } from "./buildChatPrompt";

type HandleSummarizeInput = {
  body: unknown;
  ip: string;
  now?: number;
  callModel?: typeof callDeepSeek;
};

export async function handleSummarize(input: HandleSummarizeInput) {
  const limit = chatRateLimiter.check(input.ip, input.now);
  if (!limit.allowed) {
    return Response.json({ error: "请求有点太频繁了，可以稍等一下再试。" }, { status: 429 });
  }

  const parsed = summarizeRequestSchema.safeParse(input.body);
  if (!parsed.success) {
    return Response.json({ error: "摘要内容太长或格式不对。" }, { status: 400 });
  }

  const prompt = [
    parsed.data.previousSummary ? `已有摘要：${parsed.data.previousSummary}` : "已有摘要：无",
    buildSummaryPrompt(parsed.data.messages),
  ].join("\n\n");

  const messages: DeepSeekMessage[] = [
    { role: "system", content: prompt },
    { role: "user", content: "请生成更新后的对话摘要。" },
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const summary = await (input.callModel ?? callDeepSeek)({
      messages,
      maxTokens: 300,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return Response.json({ summary });
  } catch {
    return Response.json({ error: "摘要生成失败，本轮对话仍可继续。" }, { status: 502 });
  }
}
```

- [ ] **Step 5: Create route handlers**

Create `app/api/chat/route.ts`:

```ts
import { handleChat } from "@/lib/chat/handleChat";

export async function POST(request: Request) {
  const body = await request.json();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  return handleChat({ body, ip });
}
```

Create `app/api/summarize/route.ts`:

```ts
import { handleSummarize } from "@/lib/chat/handleSummarize";

export async function POST(request: Request) {
  const body = await request.json();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  return handleSummarize({ body, ip });
}
```

- [ ] **Step 6: Run API handler verification**

Run:

```bash
pnpm test lib/chat/handleChat.test.ts lib/chat/handleSummarize.test.ts
pnpm typecheck
```

Expected:

```text
API handler tests pass
typecheck passes
```

- [ ] **Step 7: Commit API handlers**

Run:

```bash
git add lib/chat/handleChat.ts lib/chat/handleChat.test.ts lib/chat/handleSummarize.ts lib/chat/handleSummarize.test.ts app/api
git commit -m "feat: add chat and summary api handlers"
```

Expected:

```text
A commit is created for API handlers.
```

## Task 6: Mobile Chat UI

**Files:**
- Create: `components/EntryScreen.tsx`
- Create: `components/ChatMessage.tsx`
- Create: `components/ChatComposer.tsx`
- Create: `components/ContinuePanel.tsx`
- Create: `components/StatusNotice.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create presentational components**

Create `components/EntryScreen.tsx`:

```tsx
import type { EntryMode } from "@/lib/chat/conversation";

type EntryScreenProps = {
  onSelectMode: (mode: EntryMode) => void;
};

export function EntryScreen({ onSelectMode }: EntryScreenProps) {
  return (
    <section className="entry-screen">
      <p className="eyebrow">为工友敲键盘的摊位助手</p>
      <h1>数据平权，AI 下乡</h1>
      <p className="entry-copy">
        摊主正在和别人聊时，你可以先问我。我的回答只基于摊位准备的材料；说不清的地方会说清楚。
      </p>
      <div className="entry-actions" aria-label="选择开始方式">
        <button type="button" onClick={() => onSelectMode("intro")}>
          我先看看这是啥
        </button>
        <button type="button" onClick={() => onSelectMode("doubt")}>
          我有点怀疑
        </button>
        <button type="button" onClick={() => onSelectMode("continue")}>
          我想继续聊
        </button>
      </div>
    </section>
  );
}
```

Create `components/ChatMessage.tsx`:

```tsx
import type { ChatMessage as ChatMessageType } from "@/lib/chat/conversation";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  return (
    <article className={`message message-${message.role}`}>
      <div className="message-label">{message.role === "user" ? "你" : "摊位助手"}</div>
      <div className="message-content">{message.content}</div>
    </article>
  );
}
```

Create `components/ChatComposer.tsx`:

```tsx
import { Send } from "lucide-react";
import { FormEvent, useState } from "react";

type ChatComposerProps = {
  disabled: boolean;
  onSend: (message: string) => void;
};

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [value, setValue] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        aria-label="输入问题"
        placeholder="问点什么..."
        value={value}
        maxLength={1000}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        rows={1}
      />
      <button type="submit" disabled={disabled || value.trim().length === 0} aria-label="发送">
        <Send size={18} />
      </button>
    </form>
  );
}
```

Create `components/ContinuePanel.tsx`:

```tsx
import { Info } from "lucide-react";

export function ContinuePanel() {
  return (
    <details className="continue-panel">
      <summary>
        <Info size={16} />
        继续了解
      </summary>
      <div className="continue-body">
        <p>如果你想继续聊，可以等摊主空下来直接问。</p>
        <p>官网、文档和联系方式会放在这里。活动前把二维码图片或链接替换进来即可。</p>
      </div>
    </details>
  );
}
```

Create `components/StatusNotice.tsx`:

```tsx
export function StatusNotice({ children }: { children: string }) {
  return <p className="status-notice">{children}</p>;
}
```

- [ ] **Step 2: Implement the client app shell**

Replace `app/page.tsx` with:

```tsx
"use client";

import { useMemo, useState } from "react";
import { ChatComposer } from "@/components/ChatComposer";
import { ChatMessage } from "@/components/ChatMessage";
import { ContinuePanel } from "@/components/ContinuePanel";
import { EntryScreen } from "@/components/EntryScreen";
import { StatusNotice } from "@/components/StatusNotice";
import {
  compactMessagesForRequest,
  messagesForSummary,
  recentMessagesAfterSummary,
  shouldSummarize,
  type ChatMessage as ChatMessageType,
  type EntryMode,
} from "@/lib/chat/conversation";

const openingMessages: Record<EntryMode, string> = {
  intro:
    "这个摊位想讨论一件事：AI 时代的软件和数据能力，能不能不只服务平台和公司，也认真服务普通劳动者。“为工友敲键盘”现在还是早期项目，正在整理理念、寻找同路人，并尝试做真正有用的工具。你可以继续问：数据平权是什么意思、AI 下乡为什么重要，或者这和普通公益有什么不同。",
  doubt:
    "怀疑很正常，尤其是看到“为工友”“AI”“数据平权”这些词放在一起。你可以直接问尖锐一点：这是不是中产自我感动，AI 会不会只是资本的新工具，或者这个项目凭什么说自己在服务工友。材料说不清的地方，我不会硬圆。",
  continue:
    "可以继续问我，也可以等摊主空下来直接聊。如果你还没想好怎么开口，可以先把问题丢给我，我也可以帮你整理成适合现场继续聊的问题。官网和联系方式在页面的“继续了解”里，不会打断你现在的对话。",
  free: "",
};

function createMessage(role: ChatMessageType["role"], content: string): ChatMessageType {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

export default function Home() {
  const [mode, setMode] = useState<EntryMode>("free");
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [conversationSummary, setConversationSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const started = messages.length > 0;
  const visibleMessages = useMemo(() => messages, [messages]);

  function startWithMode(nextMode: EntryMode) {
    setMode(nextMode);
    const opening = openingMessages[nextMode];
    if (opening) setMessages([createMessage("assistant", opening)]);
  }

  async function summarizeIfNeeded(nextMessages: ChatMessageType[]) {
    if (!shouldSummarize(nextMessages)) return { summary: conversationSummary, messages: nextMessages };

    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        previousSummary: conversationSummary,
        messages: messagesForSummary(nextMessages),
      }),
    });

    if (!response.ok) {
      return { summary: conversationSummary, messages: nextMessages };
    }

    const data = (await response.json()) as { summary: string };
    setConversationSummary(data.summary);
    const recent = recentMessagesAfterSummary(nextMessages);
    setMessages(recent);
    return { summary: data.summary, messages: recent };
  }

  async function sendMessage(content: string) {
    const userMessage = createMessage("user", content);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);
    setNotice("");

    try {
      const compacted = await summarizeIfNeeded(nextMessages);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          message: content,
          messages: compactMessagesForRequest(compacted.messages),
          conversationSummary: compacted.summary,
        }),
      });

      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !data.answer) {
        throw new Error(data.error ?? "请求失败");
      }

      setMessages((current) => [...current, createMessage("assistant", data.answer)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "网络可能有点不稳，可以重试一次。";
      setNotice(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      {!started ? <EntryScreen onSelectMode={startWithMode} /> : null}
      {started ? (
        <section className="chat-shell" aria-label="对话">
          <div className="chat-header">
            <span>数据平权，AI 下乡</span>
          </div>
          <div className="message-list">
            {visibleMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {loading ? <StatusNotice>正在组织回答...</StatusNotice> : null}
            {notice ? <StatusNotice>{notice}</StatusNotice> : null}
          </div>
        </section>
      ) : null}
      <ContinuePanel />
      <ChatComposer disabled={loading} onSend={sendMessage} />
    </main>
  );
}
```

- [ ] **Step 3: Replace app metadata and styles**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "数据平权，AI 下乡",
  description: "为工友敲键盘的摊位助手",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Replace `app/globals.css` with:

```css
:root {
  color-scheme: light;
  --bg: #f7f7f4;
  --panel: #ffffff;
  --text: #191919;
  --muted: #62625e;
  --border: #ddddd6;
  --accent: #136f63;
  --accent-ink: #ffffff;
  --assistant: #ffffff;
  --user: #e9f4ef;
  --danger: #8b2d2d;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
}

button,
textarea {
  font: inherit;
}

.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 96px;
}

.entry-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  min-height: 62dvh;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.15;
  font-weight: 760;
  letter-spacing: 0;
}

.entry-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
  font-size: 16px;
}

.entry-actions {
  display: grid;
  gap: 10px;
}

.entry-actions button {
  min-height: 48px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text);
  border-radius: 8px;
  text-align: left;
  padding: 0 14px;
}

.chat-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-header {
  position: sticky;
  top: 0;
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: blur(10px);
  padding: 8px 0 12px;
  color: var(--muted);
  font-size: 14px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 0 20px;
}

.message {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 13px;
  line-height: 1.7;
}

.message-assistant {
  background: var(--assistant);
}

.message-user {
  background: var(--user);
}

.message-label {
  margin-bottom: 4px;
  color: var(--muted);
  font-size: 13px;
}

.message-content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.continue-panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  margin: 12px 0;
}

.continue-panel summary {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  color: var(--muted);
  cursor: pointer;
}

.continue-body {
  padding: 0 12px 12px;
  color: var(--muted);
  line-height: 1.65;
  font-size: 14px;
}

.status-notice {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.composer {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: min(100%, 760px);
  display: grid;
  grid-template-columns: 1fr 44px;
  gap: 8px;
  padding: 10px 16px 16px;
  background: color-mix(in srgb, var(--bg) 94%, transparent);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(10px);
}

.composer textarea {
  width: 100%;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--panel);
  color: var(--text);
  outline: none;
}

.composer button {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 8px;
  background: var(--accent);
  color: var(--accent-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.composer button:disabled {
  opacity: 0.45;
}

@media (min-width: 720px) {
  .app-shell {
    padding-top: 40px;
  }

  h1 {
    font-size: 44px;
  }
}
```

- [ ] **Step 4: Run UI verification**

Run:

```bash
pnpm typecheck
pnpm build
```

Expected:

```text
typecheck passes
Next.js build succeeds
```

- [ ] **Step 5: Commit mobile UI**

Run:

```bash
git add app components
git commit -m "feat: add mobile booth chat interface"
```

Expected:

```text
A commit is created for the mobile UI.
```

## Task 7: Documentation And Manual Test Cases

**Files:**
- Create: `docs/manual-test-cases.md`
- Create: `docs/deployment.md`
- Modify: `README.md`

- [ ] **Step 1: Create manual test cases**

Create `docs/manual-test-cases.md`:

```md
# Manual Test Cases

Run these after `pnpm dev` starts and after deployment.

## Entry Modes

1. Open the app on a mobile viewport.
2. Tap “我先看看这是啥”.
3. Confirm the first assistant message gives a short 30-second introduction.
4. Refresh the page.
5. Tap “我有点怀疑”.
6. Confirm the assistant invites sharp questions without arguing.
7. Refresh the page.
8. Tap “我想继续聊”.
9. Confirm the assistant says the user can continue asking or return to the booth, without forcing website or QR code.

## Knowledge Questions

Ask:

- 数据平权是什么意思？
- AI 下乡是什么意思？
- 为工友敲键盘和普通公益有什么区别？

Expected:

- Answers are short and grounded in the approved knowledge files.
- Answers do not cite sources unless asked.

## Hard Questions

Ask:

- 这是不是中产自我感动？
- 你们凭什么代表工友？
- AI 不就是资本家提高剥削效率的工具吗？

Expected:

- Answers acknowledge the concern.
- Answers do not claim the project already represents workers.
- Answers avoid slogan-like language.

## Out-of-Scope Questions

Ask:

- 你怎么看小金毛？
- 这场辩论谁会赢？
- 我这个症状要不要吃药？
- 帮我写一份法律诉状。

Expected:

- Answers explain that booth materials do not cover the topic.
- Answers redirect to the project theme or suggest asking the booth owner.

## Source Follow-Up

Ask:

- 你依据哪份材料？
- 原文在哪里？

Expected:

- The assistant can mention the relevant material title or source id.

## Long Conversation

1. Ask “AI 为什么不会变成剥削工具？”
2. Ask “那你们怎么避免这个？”
3. Ask enough follow-up questions to trigger summary.
4. Ask “刚才那个风险具体怎么处理？”

Expected:

- The assistant preserves the topic through summary memory.
- Refreshing the page clears the conversation.

## Failure Behavior

1. Temporarily remove `DEEPSEEK_API_KEY`.
2. Ask a question.
3. Confirm the UI shows a short retry or booth fallback message.
4. Restore the key.
```

- [ ] **Step 2: Create deployment guide**

Create `docs/deployment.md`:

```md
# Deployment

This app is designed for a temporary activity URL plus QR code.

## Environment Variables

Set:

```text
DEEPSEEK_API_KEY=your key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
CHAT_RATE_LIMIT_PER_MINUTE=10
CHAT_RATE_LIMIT_PER_HOUR=100
```

## Local Run

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Build Check

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Temporary Deployment

Deploy to a platform that supports Next.js App Router route handlers and server-side environment variables.

After deployment:

1. Open the temporary HTTPS URL on a phone.
2. Run `docs/manual-test-cases.md`.
3. Generate a QR code from the deployed URL.
4. Print the QR code for the booth.

## Privacy Note

The app does not implement login, contact forms, analytics, or application-level chat persistence. Each request is temporarily processed by the deployment platform and DeepSeek API provider.
```

- [ ] **Step 3: Update README**

Replace `README.md` with:

```md
# 数据平权，AI 下乡：摊位助手

一次性线下活动 H5 app，用于在摊主忙碌时帮助围观者、等待者和不方便当面开口的人了解“为工友敲键盘”的摊位理念。

本仓库独立于 `ideal` 理念档案仓库。`ideal` 可作为早期材料来源，但本 app 的知识库会单独整理、审核和加载。

## Development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Docs

- Design spec: `docs/superpowers/specs/2026-06-13-booth-ai-assistant-design.md`
- Implementation plan: `docs/superpowers/plans/2026-06-13-booth-ai-assistant-implementation.md`
- Manual tests: `docs/manual-test-cases.md`
- Deployment: `docs/deployment.md`
```

- [ ] **Step 4: Run docs verification**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected:

```text
all tests pass
typecheck passes
Next.js build succeeds
```

- [ ] **Step 5: Commit docs**

Run:

```bash
git add README.md docs/manual-test-cases.md docs/deployment.md
git commit -m "docs: add deployment and manual test guides"
```

Expected:

```text
A commit is created for docs.
```

## Task 8: Final Local Verification And Push

**Files:**
- Inspect: all files changed by Tasks 1-7

- [ ] **Step 1: Run full verification**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
git status --short
```

Expected:

```text
all tests pass
typecheck passes
Next.js build succeeds
git status shows no unstaged changes
```

- [ ] **Step 2: Start local server**

Run:

```bash
pnpm dev
```

Expected:

```text
Next.js starts on http://localhost:3000 or the next available port.
```

- [ ] **Step 3: Browser smoke test**

Use the in-app Browser to open the local URL and verify:

```text
The first viewport shows “数据平权，AI 下乡”.
The three entry buttons fit on mobile width.
The input bar is visible.
The continue panel is visible but not intrusive.
```

- [ ] **Step 4: API smoke test**

With `DEEPSEEK_API_KEY` configured, ask:

```text
数据平权是什么意思？
```

Expected:

```text
The app returns a short answer grounded in knowledge/public materials.
```

- [ ] **Step 5: Push final branch**

Run:

```bash
git push origin main
```

Expected:

```text
main is pushed to GitHub.
```

## Self-Review

Spec coverage:

- Mobile H5, one-off repo, DeepSeek proxy, simple retrieval, summary memory, no login, no contact collection, no server-side session persistence, source-on-request, warm redirect, rate limiting, weak-network UI, docs, and testing are covered by Tasks 1-8.

Placeholder scan:

- This plan contains no intentionally unfinished file content. Every created code file has explicit content in its task.

Type consistency:

- `EntryMode`, `ChatMessage`, `RetrievedChunk`, `KnowledgeChunk`, route handler payloads, and validation schema names are defined before use and reused consistently.

