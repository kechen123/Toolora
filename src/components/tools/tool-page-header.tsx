import { cn } from "cn";
import { CalendarClock, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CATEGORY_ACCENT } from "@/lib/category-accent";
import { ICONS } from "@/lib/icons";
import { getCategoryBySlug } from "@/registry/tools";
import type { ToolDefinition } from "@/types/tool";

/** 工具详情页顶部：面包屑 + 图标 + 标题 + 描述 + 元信息。 */
export function ToolPageHeader({ tool }: { tool: ToolDefinition }) {
  const category = getCategoryBySlug(tool.categorySlug);
  const accent = category ? CATEGORY_ACCENT[category.accent] : CATEGORY_ACCENT.indigo;
  const Icon = ICONS[tool.icon];

  return (
    <header className="border-b border-border pb-6">
      <Breadcrumb aria-label="面包屑导航">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">首页</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {category ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage>{tool.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className={cn(
            "inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
            accent.tile,
          )}
        >
          <Icon className="size-6" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {tool.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {category ? (
              <span className="inline-flex items-center gap-1.5">
                <ChevronRight className="size-3.5" aria-hidden="true" />
                {category.name}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5" aria-hidden="true" />
              更新于 {tool.updatedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              浏览器本地处理
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
