"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

/** 值的类型标签，显示在行尾。 */
function typeLabel(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
}

/** 基本类型的显示文本。 */
function primitiveText(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return String(value);
}

/** 容器类型的摘要，例如 `{ 3 }` / `[ 2 ]`。 */
function containerSummary(value: unknown): string {
  if (Array.isArray(value)) {
    return `[ ${value.length} ]`;
  }
  return `{ ${Object.keys(value as object).length} }`;
}

interface JsonTreeProps {
  value: unknown;
  /** 当前节点的键名；根节点没有键名。 */
  label?: string;
  /** 用于记录展开状态的唯一路径。 */
  path: string;
  depth: number;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
}

/**
 * JSON 树形视图。
 *
 * 只在解析成功时渲染；解析失败时由调用方展示错误信息，
 * 避免展示看起来有效但其实已经过期的结构。
 */
export function JsonTree({ value, label, path, depth, collapsed, onToggle }: JsonTreeProps) {
  const isContainer = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const isCollapsed = collapsed.has(path);

  if (!isContainer) {
    return (
      <li className="flex items-baseline justify-between gap-3 leading-5">
        <span className="min-w-0 truncate">
          {label !== undefined ? (
            <>
              <span className="text-primary/85">{label}</span>
              <span className="text-muted-foreground/70">: </span>
            </>
          ) : null}
          <span className="text-foreground/90">{primitiveText(value)}</span>
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{typeLabel(value)}</span>
      </li>
    );
  }

  const entries: Array<{ key: string; child: unknown; childPath: string }> = isArray
    ? (value as unknown[]).map((child, index) => ({
        key: String(index),
        child,
        childPath: `${path}[${index}]`,
      }))
    : Object.entries(value as Record<string, unknown>).map(([key, child]) => ({
        key,
        child,
        childPath: `${path}.${key}`,
      }));

  return (
    <li className="leading-5">
      <button
        type="button"
        onClick={() => onToggle(path)}
        aria-expanded={!isCollapsed}
        className="flex w-full items-baseline justify-between gap-3 rounded text-left outline-none hover:bg-muted/60 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="flex min-w-0 items-baseline gap-1">
          {isCollapsed ? (
            <ChevronRight className="size-3 shrink-0 translate-y-0.5 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3 shrink-0 translate-y-0.5 text-muted-foreground" aria-hidden="true" />
          )}
          {label !== undefined ? (
            <>
              <span className="text-primary/85">{label}</span>
              <span className="text-muted-foreground/70">: </span>
            </>
          ) : null}
          <span className="text-muted-foreground">{containerSummary(value)}</span>
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{typeLabel(value)}</span>
      </button>

      {!isCollapsed && entries.length > 0 ? (
        <ul className="mt-0.5 space-y-0.5 border-l border-border/70 pl-3">
          {entries.map((entry) => (
            <JsonTree
              key={entry.childPath}
              value={entry.child}
              label={entry.key}
              path={entry.childPath}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
