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
        <p>官网、文档和联系方式会放在这里。活动前把二维码图片或链接替换进来即可。</p>
      </div>
    </details>
  );
}
