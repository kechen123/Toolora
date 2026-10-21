import type { ToolGuide } from "@/types/tool";

/**
 * 工具模块索引。
 *
 * 每个工具的正文内容放在各自的模块目录中，通过动态导入按需加载，
 * 新增工具时只需要补充模块并在注册表中登记。
 */
const guideLoaders: Record<string, () => Promise<ToolGuide>> = {
  "image-compress": () =>
    import("@/tools/image-compress/guide").then((mod) => mod.imageCompressGuide),
  "json-formatter": () =>
    import("@/tools/json-formatter/guide").then((mod) => mod.jsonFormatterGuide),
  "pdf-merge": () => import("@/tools/pdf-merge/guide").then((mod) => mod.pdfMergeGuide),
};

/** 读取指定工具的正文内容；工具尚未提供模块时返回 undefined。 */
export async function getToolGuide(slug: string): Promise<ToolGuide | undefined> {
  const loader = guideLoaders[slug];
  if (!loader) {
    return undefined;
  }
  return loader();
}
