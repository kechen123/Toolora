"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { primaryNavItems } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

/** 顶部导航栏。 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <MobileNav />
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <BrandMark className="size-8 rounded-[10px]" />
            <span className="text-[15px] font-semibold tracking-tight">{siteConfig.name}</span>
          </Link>
        </div>

        <nav aria-label="顶部导航" className="hidden items-center gap-1 md:flex lg:ml-0">
          {primaryNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
