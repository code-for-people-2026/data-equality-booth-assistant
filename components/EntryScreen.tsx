import type { EntryMode } from "@/lib/chat/conversation";

type EntryScreenProps = {
  onSelectMode: (mode: EntryMode) => void;
};

const entryOptions: Array<{ mode: EntryMode; label: string }> = [
  { mode: "intro", label: "我先看看这是啥" },
  { mode: "doubt", label: "我有点怀疑" },
  { mode: "continue", label: "我想继续聊" },
];

export function EntryScreen({ onSelectMode }: EntryScreenProps) {
  return (
    <section className="entry-screen">
      <p className="eyebrow">为工友敲键盘的摊位助手</p>
      <h1>数据平权，AI 下乡</h1>
      <p className="entry-copy">
        摊主正在和别人聊时，你可以先问我。我的回答只基于摊位准备的材料；说不清的地方会说清楚。
      </p>
      <div className="entry-actions" aria-label="选择开始方式">
        {entryOptions.map((option) => (
          <button key={option.mode} type="button" onClick={() => onSelectMode(option.mode)}>
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
