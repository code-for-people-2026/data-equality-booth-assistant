import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("style system", () => {
  it("does not hard-code a light assistant message surface", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const assistantBlock = css.match(/\.message-assistant\s*{[^}]+}/)?.[0] ?? "";

    expect(assistantBlock).not.toContain("rgba(255, 253, 248");
    expect(assistantBlock).toContain("var(--card)");
  });
});
