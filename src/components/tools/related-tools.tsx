import { ToolCard } from "@/components/tools/tool-card";
import { getRelatedTools } from "@/registry/tools";
import type { ToolDefinition } from "@/types/tool";

/** 工具详情页底部的「相关工具」推荐。 */
export function RelatedTools({ tool }: { tool: ToolDefinition }) {
  const relatedTools = getRelatedTools(tool);

  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-tools-heading">
      <h2 id="related-tools-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
        相关工具
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {relatedTools.map((related) => (
          <ToolCard key={related.slug} tool={related} />
        ))}
      </div>
    </section>
  );
}
