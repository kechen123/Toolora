"use client";

import { Search } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { dispatchActivateSearch } from "@/lib/search-shortcut";
import { siteConfig } from "@/lib/site";

/** 桌面端左侧导航栏。 */
export function SiteSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-tight">{siteConfig.name}</span>
        </Link>
      </div>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => dispatchActivateSearch()}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">搜索工具…</span>
          <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <SidebarNav />
      </div>

      <div className="shrink-0 border-t border-sidebar-border px-5 py-4 text-[11px] leading-relaxed text-muted-foreground">
        本地处理 · 数据不上传
        <span className="mt-0.5 block text-muted-foreground/70">无需注册登录</span>
      </div>
    </aside>
  );
}
