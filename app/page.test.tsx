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

  it("keeps the visual direction out of the page copy", () => {
    render(<Home />);

    expect(screen.queryByText(/PUBLIC AI LAB/)).not.toBeInTheDocument();
    expect(screen.queryByText(/公共智能实验室/)).not.toBeInTheDocument();
    expect(screen.queryByText(/DOC 01/)).not.toBeInTheDocument();
    expect(screen.queryByText(/SPEC 02/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ATLAS 03/)).not.toBeInTheDocument();
    expect(screen.queryByText(/分析记录/)).not.toBeInTheDocument();
    expect(screen.queryByText(/约束检查/)).not.toBeInTheDocument();
  });

  it("starts with the doubt opening message", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "我有点怀疑" }));

    expect(screen.getByText(/怀疑很正常/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "我先看看这是啥" })).not.toBeInTheDocument();
    expect(screen.queryByText(/PUBLIC AI LAB/)).not.toBeInTheDocument();
    expect(screen.queryByText(/公共智能实验室/)).not.toBeInTheDocument();
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

  it("sends the current question separately from prior context", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ answer: "这是一个基于摊位材料的回答。" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<Home />);
    await user.click(screen.getByRole("button", { name: "我有点怀疑" }));
    await user.type(screen.getByLabelText("输入问题"), "数据平权是什么意思？");
    await user.click(screen.getByRole("button", { name: "发送" }));

    await waitFor(() => {
      expect(screen.getByText("这是一个基于摊位材料的回答。")).toBeInTheDocument();
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(request.body as string) as {
      conversationSummary: string;
      message: string;
      messages: Array<{ content: string; role: string }>;
      mode: string;
    };

    expect(body.mode).toBe("doubt");
    expect(body.message).toBe("数据平权是什么意思？");
    expect(body.conversationSummary).toBe("");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("assistant");
    expect(body.messages.some((message) => message.content === "数据平权是什么意思？")).toBe(false);
  });

  it("continues chatting when summary generation fails", async () => {
    const user = userEvent.setup();
    let chatReplies = 0;
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/summarize") {
        return Promise.reject(new Error("summary unavailable"));
      }

      chatReplies += 1;
      return Promise.resolve(
        new Response(JSON.stringify({ answer: `回答 ${chatReplies}` }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Home />);
    await user.click(screen.getByRole("button", { name: "我有点怀疑" }));

    for (const question of ["问题一", "问题二", "问题三", "问题四", "问题五"]) {
      await user.type(screen.getByLabelText("输入问题"), question);
      await user.click(screen.getByRole("button", { name: "发送" }));
      await waitFor(() => {
        expect(screen.getByText(`回答 ${chatReplies}`)).toBeInTheDocument();
      });
    }

    expect(fetchMock).toHaveBeenCalledWith("/api/summarize", expect.objectContaining({ method: "POST" }));
    expect(screen.getByText("回答 5")).toBeInTheDocument();
  });

  it("shows user-facing continuation copy", () => {
    render(<Home />);

    expect(screen.getByText("继续了解")).toBeInTheDocument();
    expect(screen.queryByText(/替换/)).not.toBeInTheDocument();
    expect(screen.queryByText(/活动前/)).not.toBeInTheDocument();
  });
});
