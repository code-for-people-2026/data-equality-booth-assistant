import { Info } from "lucide-react";

export function ContinuePanel() {
  return (
    <details className="continue-panel">
      <summary>
        <Info aria-hidden="true" size={16} />
        继续了解
      </summary>
      <div className="continue-body">
        <p>如果你想继续聊，可以等摊主空下来直接问。</p>
        <p>这里会放摊位现场提供的官网、文档或联系方式入口；也可以先让 AI 帮你把问题整理清楚。</p>
      </div>
    </details>
  );
}
