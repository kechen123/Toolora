import { cn } from "cn";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/home/section-heading";
import { CATEGORY_ACCENT } from "@/lib/category-accent";
import { ICONS } from "@/lib/icons";
import { getCategoriesWithTools } from "@/registry/tools";

/** 首页「按分类浏览」区块，分类与工具数量均来自注册表。 */
export function CategoryGrid() {
  const categories = getCategoriesWithTools();

  if (categories.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="category-grid-heading">
      <SectionHeading id="category-grid-heading" title="按分类浏览" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = ICONS[category.icon];
          const accent = CATEGORY_ACCENT[category.accent];

          return (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="surface-card group flex items-center gap-3.5 p-4 transition-all hover:border-primary/40 hover:shadow-[0_8px_24px_-14px_rgb(15_23_42/0.22)]"
            >
              <span
                className={cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
                  accent.tile,
                )}
              >
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold tracking-tight">
                  {category.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {category.toolCount} 个工具
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
