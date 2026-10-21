"use client";

import { cn } from "cn";
import Link from "next/link";

import { CATEGORY_ACCENT } from "@/lib/category-accent";
import { ICONS } from "@/lib/icons";
import { getCategoryBySlug } from "@/registry/tools";
import type { ToolDefinition } from "@/types/tool";

/**
 * 工具卡片。
 *
 * 首页、分类页与全部工具页共用同一张卡片，保证全站视觉一致。
 * `headingLevel` 用于适配不同页面的标题层级，避免出现 h1 → h3 的跳级。
 */
export function ToolCard({
  tool,
  headingLevel: Heading = "h3",
}: {
  tool: ToolDefinition;
  headingLevel?: "h2" | "h3";
}) {
  const category = getCategoryBySlug(tool.categorySlug);
  const accent = category ? CATEGORY_ACCENT[category.accent] : CATEGORY_ACCENT.indigo;
  const Icon = ICONS[tool.icon];

  return (
    <Link href={`/tools/${tool.slug}`} className="tool-card">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
            accent.tile,
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </span>
        <Heading className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">
          {tool.name}
        </Heading>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tool.shortDescription}</p>
    </Link>
  );
}
