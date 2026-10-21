import dynamic from "next/dynamic";

import type { ToolWorkspace } from "@/types/tool";

/** 工作区骨架屏：动态模块加载过程中的占位。 */
function WorkspaceSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-5 rounded-xl border border-border bg-card p-5 lg:grid-cols-2"
    >
      <div className="h-64 rounded-xl bg-muted/60" />
      <div className="h-64 rounded-xl bg-muted/60" />
    </div>
  );
}

/**
 * 按需加载工具的主操作区。
 *
 * 每个工具的工作区是独立模块，只有进入对应工具页面时才会被打包，
 * 避免所有工具的实现都进入同一个 chunk。
 */
const ImageWorkspace = dynamic(
  () => import("@/tools/image-compress/workspace").then((mod) => mod.ImageWorkspace),
  { loading: () => <WorkspaceSkeleton /> },
);

const JsonWorkspace = dynamic(
  () => import("@/tools/json-formatter/workspace").then((mod) => mod.JsonWorkspace),
  { loading: () => <WorkspaceSkeleton /> },
);

const PdfWorkspace = dynamic(
  () => import("@/tools/pdf-merge/workspace").then((mod) => mod.PdfWorkspace),
  { loading: () => <WorkspaceSkeleton /> },
);

export function ToolWorkspaceArea({ workspace }: { workspace: ToolWorkspace }) {
  switch (workspace) {
    case "image":
      return <ImageWorkspace />;
    case "json":
      return <JsonWorkspace />;
    case "pdf":
      return <PdfWorkspace />;
    default:
      return null;
  }
}
