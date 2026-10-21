"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ToolCard } from "@/components/tools/tool-card";
import { tools } from "@/registry/tools";

/**
 * 全部工具页的工具列表。
 *
 * 提供基于注册表数据的即时过滤，只在浏览器内完成，不会发起任何请求。
 */
export function ToolDirectory() {
  const [keyword, setKeyword] = useState("");

  const visibleTools = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) {
      return tools;
    }
    return tools.filter((tool) =>
      [tool.name, tool.shortDescription, tool.description, ...tool.keywords]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [keyword]);

  return (
    <div>
      <div className="relative mb-6 max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          aria-label="在全部工具中筛选"
          placeholder="在全部工具中筛选…"
          className="h-10 w-full rounded-lg border border-input bg-card pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-search-cancel-button]:appearance-none"
        />
      </div>

      {visibleTools.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} headingLevel="h2" />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          没有匹配的工具，换个关键词试试。
        </p>
      )}
    </div>
  );
}
