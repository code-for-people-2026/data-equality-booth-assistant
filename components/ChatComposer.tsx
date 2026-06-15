"use client";

import { Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ChatComposerProps = {
  disabled: boolean;
  onSend: (message: string) => void;
};

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="composer-shell">
      <form
        className="grid grid-cols-[minmax(0,1fr)_48px] items-end gap-2.5 rounded-[28px] border border-input bg-popover p-3.5 shadow-panel backdrop-blur-[18px] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30"
        onSubmit={submit}
      >
        <textarea
          className="max-h-[150px] min-h-[62px] w-full resize-none rounded-[18px] border-0 bg-transparent px-2 py-2 text-base leading-[1.55] text-popover-foreground outline-none placeholder:text-muted-foreground/75 focus-visible:ring-0 disabled:cursor-not-allowed"
          aria-label="输入问题"
          placeholder="向摊位助手提问..."
          value={value}
          maxLength={1000}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          rows={1}
        />
        <Button
          type="submit"
          size="icon"
          className="size-12 rounded-full"
          disabled={disabled || trimmed.length === 0}
          aria-label="发送"
        >
          <Send aria-hidden="true" size={18} />
        </Button>
        <p className="col-span-2 m-0 text-center text-xs leading-none text-muted-foreground">
          内容由 AI 生成，请仔细甄别
        </p>
      </form>
    </div>
  );
}
