"use client";

import { Info, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site";

/** 移动端抽屉导航。 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="打开导航菜单" className="lg:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[17rem] p-0 data-[side=left]:w-[17rem]">
        <SheetHeader className="flex h-16 flex-row items-center gap-2.5 border-b border-sidebar-border p-0 px-5">
          <BrandMark />
          <SheetTitle className="text-[17px] font-semibold tracking-tight">{siteConfig.name}</SheetTitle>
          <SheetDescription className="sr-only">站点导航菜单</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {/* 点击导航后关闭抽屉，避免遮罩留在新页面上 */}
          <SidebarNav onNavigate={() => setOpen(false)} />
          <div className="mt-4 mb-1 px-3 text-[11px] font-medium tracking-wide text-muted-foreground/80">
            了解更多
          </div>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Info className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            <span>关于</span>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
