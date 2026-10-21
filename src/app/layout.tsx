import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { SearchShortcut } from "@/components/layout/search-shortcut";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteSidebar } from "@/components/layout/site-sidebar";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["在线工具", "免费工具", "图片压缩", "JSON 格式化", "PDF 合并", "Toolora"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider>
            <SkipLink />
            <SiteSidebar />
            <div className="lg:pl-64">
              <SiteHeader />
              <main id="main-content" className="min-h-[60vh]">
                {children}
              </main>
              <SiteFooter />
            </div>
            <SearchShortcut />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
