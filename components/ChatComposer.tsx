"use client";

import { Send } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

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
      <button type="submit" disabled={disabled || trimmed.length === 0} aria-label="发送">
        <Send aria-hidden="true" size={18} />
      </button>
    </form>
  );
}
