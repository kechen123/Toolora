import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { getCategoriesWithTools } from "@/registry/tools";
import { siteConfig } from "@/lib/site";

/** 站点页脚。 */
export function SiteFooter() {
  const categories = getCategoriesWithTools();

  return (
    <footer className="mt-16 border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-8 rounded-[10px]" />
            <span className="text-[15px] font-semibold tracking-tight">{siteConfig.name}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            免费、简洁的在线工具集合。无需注册登录，尽可能在浏览器本地完成处理，你的数据不会离开自己的设备。
          </p>
        </div>

        <nav aria-label="页脚导航" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            首页
          </Link>
          <Link href="/tools" className="text-muted-foreground transition-colors hover:text-foreground">
            全部工具
          </Link>
          <Link href="/categories" className="text-muted-foreground transition-colors hover:text-foreground">
            工具分类
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
            关于
          </Link>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-[1400px] px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {siteConfig.name} · 本站为纯静态站点，不收集、不上传任何用户文件。
        </div>
      </div>
    </footer>
  );
}
