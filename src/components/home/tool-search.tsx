"use client";

import { cn } from "cn";
import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { CATEGORY_ACCENT } from "@/lib/category-accent";
import { ICONS } from "@/lib/icons";
import { FOCUS_SEARCH_EVENT } from "@/lib/search-shortcut";
import { getCategoryBySlug, tools } from "@/registry/tools";

const LISTBOX_ID = "tool-search-listbox";

/**
 * 全站工具搜索。
 *
 * 只检索工具注册表中已存在的工具：匹配名称、关键词与简介。
 * 这是轻量的客户端过滤，不包含拼音、模糊匹配或独立的结果页，
 * 完整搜索能力会在后续阶段补充。
 */
export function ToolSearch({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return [];
    }
    return tools.filter((tool) => {
      const haystack = [tool.name, tool.shortDescription, tool.description, ...tool.keywords]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [query]);

  const hasResults = open && query.trim().length > 0;

  // 响应侧边栏入口与 ⌘K 快捷键的聚焦请求。
  useEffect(() => {
    function focusSearchBox(): void {
      inputRef.current?.focus();
      inputRef.current?.select();
      setOpen(true);
    }

    window.addEventListener(FOCUS_SEARCH_EVENT, focusSearchBox);
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, focusSearchBox);
  }, []);

  function goToResult(slug: string): void {
    setOpen(false);
    setQuery("");
    router.push(`/tools/${slug}`);
  }

  function handleSubmit(): void {
    const first = results[0];
    if (first) {
      goToResult(first.slug);
      return;
    }
    setOpen(false);
    router.push("/tools");
  }

  /** 在结果之间移动焦点：输入框 → 第一条 → 上一条 / 下一条。 */
  function moveFocus(offset: number): void {
    const options = Array.from(
      document.querySelectorAll<HTMLButtonElement>(`#${LISTBOX_ID} [role="option"]`),
    );
    if (options.length === 0) {
      return;
    }
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const next = current === -1 ? 0 : Math.min(options.length - 1, Math.max(0, current + offset));
    options[next]?.focus();
  }

  const isHero = variant === "hero";

  return (
    <div
      className="relative w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-card shadow-[0_10px_30px_-12px_rgb(15_23_42/0.18)] transition-shadow focus-within:ring-2 focus-within:ring-primary/40",
          isHero ? "h-12 pl-4 pr-1.5 sm:h-14 sm:pl-5" : "h-10 pl-3.5 pr-1",
        )}
      >
        <Search
          className={cn(
            "shrink-0 text-muted-foreground",
            isHero ? "size-4.5" : "size-4",
          )}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={hasResults && results.length > 0}
          aria-controls={results.length > 0 ? LISTBOX_ID : undefined}
          aria-autocomplete="list"
          aria-label="搜索工具"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              moveFocus(1);
            }
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            isHero
              ? "搜索你需要的工具，例如：图片压缩、JSON、PDF…"
              : "搜索工具名称或关键词…"
          }
          className={cn(
            "min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none",
            isHero ? "text-[15px] sm:text-base" : "text-sm",
          )}
        />
        <button
          type="button"
          onClick={handleSubmit}
          aria-label="搜索"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_rgb(99_102_241/0.9)] transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            isHero ? "size-10 sm:size-11" : "size-8",
          )}
        >
          <ArrowRight className={isHero ? "size-4.5" : "size-4"} aria-hidden="true" />
        </button>
      </div>

      {hasResults ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[0_18px_40px_-16px_rgb(15_23_42/0.28)]">
          {results.length > 0 ? (
            <ul
              id={LISTBOX_ID}
              role="listbox"
              aria-label="搜索结果"
              className="max-h-80 overflow-y-auto py-1"
            >
              {results.map((tool) => {
                const category = getCategoryBySlug(tool.categorySlug);
                const accent = category ? CATEGORY_ACCENT[category.accent] : CATEGORY_ACCENT.indigo;
                const Icon = ICONS[tool.icon];

                return (
                  <li key={tool.slug} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      // Safari 在 mousedown 时不会聚焦按钮，blur 会先关闭面板导致点击丢失，这里阻止默认行为。
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => goToResult(tool.slug)}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          moveFocus(1);
                        }
                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          moveFocus(-1);
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setOpen(false);
                          inputRef.current?.focus();
                        }
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                          accent.tile,
                        )}
                      >
                        <Icon className="size-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{tool.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {tool.shortDescription}
                        </span>
                      </span>
                      {category ? (
                        <span className="shrink-0 text-xs text-muted-foreground">{category.name}</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-5 text-center text-sm text-muted-foreground">
              没有找到匹配「{query.trim()}」的工具，换个关键词试试。
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
