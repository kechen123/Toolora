import { cn } from "cn";
import Link from "next/link";

import { SectionHeading } from "@/components/home/section-heading";
import { CATEGORY_ACCENT } from "@/lib/category-accent";
import { ICONS } from "@/lib/icons";
import { getCategoryBySlug, getRecentlyUpdatedTools } from "@/registry/tools";

/** 首页「最近更新」区块。 */
export function RecentlyUpdated() {
  const updatedTools = getRecentlyUpdatedTools(4);

  if (updatedTools.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="recently-updated-heading">
      <SectionHeading id="recently-updated-heading" title="最近更新" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {updatedTools.map((tool) => {
          const category = getCategoryBySlug(tool.categorySlug);
          const accent = category ? CATEGORY_ACCENT[category.accent] : CATEGORY_ACCENT.indigo;
          const Icon = ICONS[tool.icon];

          return (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="surface-card group flex flex-col gap-3 p-4 transition-all hover:border-primary/40 hover:shadow-[0_8px_24px_-14px_rgb(15_23_42/0.22)]"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex size-10 items-center justify-center rounded-xl",
                    accent.tile,
                  )}
                >
                  <Icon className="size-5" strokeWidth={2} />
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {tool.updatedAt}
                </span>
              </div>
              <div>
                <h3 className="truncate text-sm font-semibold tracking-tight">{tool.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {tool.shortDescription}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
