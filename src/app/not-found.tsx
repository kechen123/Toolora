import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">页面不存在</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        这个地址没有对应的内容，可能是链接有误，或者对应的工具还不存在。
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">返回首页</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/tools">浏览全部工具</Link>
        </Button>
      </div>
    </div>
  );
}
