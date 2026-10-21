import { SectionHeading } from "@/components/home/section-heading";
import { ToolCard } from "@/components/tools/tool-card";
import { getFeaturedTools } from "@/registry/tools";

/** 首页「常用工具」卡片区。 */
export function CommonTools() {
  const featuredTools = getFeaturedTools();

  if (featuredTools.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="common-tools-heading">
      <SectionHeading
        id="common-tools-heading"
        title="常用工具"
        description="覆盖图片处理、文本处理与文档整理的高频场景。"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {featuredTools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </section>
  );
}
