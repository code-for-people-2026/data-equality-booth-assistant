import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Home", () => {
  it("shows the booth assistant entry screen", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "数据平权，AI 下乡" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "我先看看这是啥" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "我有点怀疑" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "我想继续聊" })).toBeInTheDocument();
  });

  it("starts with the doubt opening message", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "我有点怀疑" }));

    expect(screen.getByText(/怀疑很正常/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "我先看看这是啥" })).not.toBeInTheDocument();
  });

  it("sends a chat message and displays the assistant response", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ answer: "这是一个基于摊位材料的回答。" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<Home />);
    await user.type(screen.getByLabelText("输入问题"), "数据平权是什么意思？");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => {
      expect(screen.getByText("这是一个基于摊位材料的回答。")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
