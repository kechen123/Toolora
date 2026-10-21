import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/home/section-heading";
import { getPopularTools } from "@/registry/tools";

/** 首页「热门工具」快捷入口。 */
export function PopularTools() {
  const popularTools = getPopularTools();

  if (popularTools.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="popular-tools-heading">
      <SectionHeading
        id="popular-tools-heading"
        title="热门工具"
        action={
          <Link
            href="/tools"
            className="inline-flex items-center gap-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            更多
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <ul className="flex flex-wrap gap-2">
        {popularTools.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/tools/${tool.slug}`}
              className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
            >
              {tool.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
