import type { Metadata } from "next";

import { CategoryGrid } from "@/components/home/category-grid";
import { CommonTools } from "@/components/home/common-tools";
import { Hero } from "@/components/home/hero";
import { PopularTools } from "@/components/home/popular-tools";
import { RecentlyUpdated } from "@/components/home/recently-updated";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} - 好用的在线工具集合`,
  description: siteConfig.description,
};

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Hero />

      <div className="mt-10 space-y-12 lg:mt-14 lg:space-y-16">
        <PopularTools />
        <CommonTools />
        <CategoryGrid />
        <RecentlyUpdated />
      </div>
    </div>
  );
}
