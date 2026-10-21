import type { Metadata } from "next";

import { ToolDirectory } from "@/components/tools/tool-directory";

export const metadata: Metadata = {
  title: "全部工具",
  description:
    "浏览 Toolora 提供的全部在线工具，涵盖图片处理、开发工具与 PDF 工具，全部无需登录，优先在浏览器本地完成处理。",
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">全部工具</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Toolora 的每一个工具都有独立的页面与说明文档，无需注册登录，打开网页即可使用。
        </p>
      </header>

      <div className="mt-8">
        <ToolDirectory />
      </div>
    </div>
  );
}
