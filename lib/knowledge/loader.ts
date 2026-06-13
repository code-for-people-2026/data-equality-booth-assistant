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
  const blocks = document.content
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((text) => ({
      isHeading: /^#{1,6}\s+/.test(text),
      text: text.replace(/^#{1,6}\s+/, "").trim(),
    }))
    .filter((block) => Boolean(block.text));

  const sections: string[] = [];
  let currentHeading = "";

  for (const block of blocks) {
    if (block.isHeading) {
      currentHeading = block.text;
      continue;
    }

    sections.push(currentHeading ? `${currentHeading}\n\n${block.text}` : block.text);
  }

  return sections
    .map((text, index) => ({
      id: `${document.id}#${index}`,
      sourceId: document.id,
      title: document.title,
      tags: document.tags,
      text,
      filePath: document.filePath,
    }));
}

export async function loadKnowledgeChunks(rootDir = path.join(process.cwd(), "knowledge/public")) {
  const documents = await loadKnowledgeBase(rootDir);
  return documents.flatMap(splitIntoChunks);
}
