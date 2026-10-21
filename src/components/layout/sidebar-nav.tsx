"use client";

import { cn } from "cn";
import { Home, LayoutGrid, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CATEGORY_ACCENT } from "@/lib/category-accent";
import { ICONS } from "@/lib/icons";
import { sidebarStaticItems } from "@/lib/navigation";
import { getCategoriesWithTools } from "@/registry/tools";

const staticIcons: Record<string, LucideIcon> = {
  "/": Home,
  "/tools": LayoutGrid,
};

/** 判断导航项是否处于当前页面。 */
function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 侧边栏导航内容。
 *
 * 桌面侧边栏与移动端抽屉共用同一份导航，分类项全部来自工具注册表，
 * 只渲染至少包含一个工具的分类，避免出现指向空页面的链接。
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const categories = getCategoriesWithTools();

  return (
    <nav aria-label="主导航" className="flex flex-col gap-1">
      {sidebarStaticItems.map((item) => {
        const Icon = staticIcons[item.href] ?? LayoutGrid;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-foreground/75 hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={2} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      <div className="mt-4 mb-1 px-3 text-[11px] font-medium tracking-wide text-muted-foreground/80">
        工具分类
      </div>

      {categories.map((category) => {
        const Icon = ICONS[category.icon];
        const active = isActivePath(pathname, `/categories/${category.slug}`);
        const accent = CATEGORY_ACCENT[category.accent];

        return (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-foreground/75 hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? accent.icon : "text-muted-foreground")} strokeWidth={2} />
            <span className="truncate">{category.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
