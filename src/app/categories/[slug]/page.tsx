import type { Metadata } from "next";
import { cn } from "cn";
import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ToolCard } from "@/components/tools/tool-card";
import { CATEGORY_ACCENT } from "@/lib/category-accent";
import { ICONS } from "@/lib/icons";
import { categories } from "@/registry/categories";
import { getCategoryBySlug, getToolsByCategory } from "@/registry/tools";

/** 只生成注册表中已登记的分类，未知 slug 直接 404。 */
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return { title: "分类不存在" };
  }

  return {
    title: `${category.name} - 免费在线${category.name}`,
    description: category.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const categoryTools = getToolsByCategory(category.slug);
  const toolCount = categoryTools.length;
  const Icon = ICONS[category.icon];
  const accent = CATEGORY_ACCENT[category.accent];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Breadcrumb aria-label="面包屑导航">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">首页</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-6 border-b border-border pb-6">
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
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{category.name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{toolCount} 个工具</p>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {category.description}
        </p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-3">
          {category.highlights.map((highlight) => (
            <li
              key={highlight}
              className="flex items-start gap-2 rounded-lg border border-border bg-card px-3.5 py-3 text-sm leading-relaxed text-muted-foreground"
            >
              <Sparkles
                className={cn("mt-0.5 size-4 shrink-0", accent.icon)}
                aria-hidden="true"
              />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </header>

      <section aria-labelledby="category-tools-heading" className="mt-8">
        <h2 id="category-tools-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
          {category.name}的全部工具
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categoryTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          想找其他分类的工具？
          <Link
            href="/tools"
            className="ml-1 inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
          >
            查看全部工具
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </p>
      </section>
    </div>
  );
}
