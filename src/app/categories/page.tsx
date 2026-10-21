import type { Metadata } from "next";
import { cn } from "cn";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { CATEGORY_ACCENT } from "@/lib/category-accent";
import { ICONS } from "@/lib/icons";
import { getCategoriesWithTools } from "@/registry/tools";

export const metadata: Metadata = {
  title: "工具分类",
  description:
    "按分类浏览 Toolora 的在线工具：图片工具、开发工具与 PDF 工具，每个分类都有独立的介绍与工具清单。",
};

export default function CategoriesPage() {
  const categories = getCategoriesWithTools();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">工具分类</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          按用途浏览工具。每个分类都集中解决一类问题，工具数量与内容均与站内注册表保持一致。
        </p>
      </header>

      <div className="mt-8 space-y-6">
        {categories.map((category) => {
          const Icon = ICONS[category.icon];
          const accent = CATEGORY_ACCENT[category.accent];

          return (
            <section key={category.slug} className="surface-card p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
                      accent.tile,
                    )}
                  >
                    <Icon className="size-6" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight">{category.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{category.toolCount} 个工具</p>
                  </div>
                </div>

                <Link
                  href={`/categories/${category.slug}`}
                  className="inline-flex shrink-0 items-center gap-0.5 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  进入分类
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {category.description}
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
