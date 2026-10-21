"use client";

import { cn } from "cn";
import {
  Braces,
  Check,
  Copy,
  Crosshair,
  Download,
  Eraser,
  FileUp,
  Minimize2,
  TriangleAlert,
  WrapText,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadBlob } from "@/lib/file-utils";
import { JsonTree } from "@/tools/json-formatter/json-tree";
import {
  countLines,
  formatJsonValue,
  minifyJsonValue,
  parseJsonStrict,
  type JsonErrorInfo,
  type JsonIndent,
  type JsonParseResult,
} from "@/tools/json-formatter/json-parse";

/** 自动解析的最大输入长度，超出后需要手动点击「校验」。 */
const AUTO_PARSE_LIMIT = 2 * 1024 * 1024;

/** 自动解析的防抖时间（毫秒）。 */
const AUTO_PARSE_DELAY = 400;

type Status = { kind: "success" | "error" | "info"; message: string } | null;

/** 复制文本：优先使用剪贴板 API，失败时回退到 execCommand。 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 权限被拒绝时继续尝试回退方案。
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  } catch {
    return false;
  }
}

/** JSON 格式化工具的主操作区：可编辑输入 + 树形视图。 */
export function JsonWorkspace() {
  const [text, setText] = useState("");
  const [indent, setIndent] = useState<JsonIndent>(2);
  const [parseState, setParseState] = useState<{
    source: string;
    result: JsonParseResult;
  } | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const gutterRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 输入停止后自动解析，实时同步树形视图与错误提示。
  useEffect(() => {
    if (text.trim().length === 0 || text.length > AUTO_PARSE_LIMIT) {
      return;
    }
    const timer = window.setTimeout(() => {
      setParseState({ source: text, result: parseJsonStrict(text) });
    }, AUTO_PARSE_DELAY);
    return () => window.clearTimeout(timer);
  }, [text]);

  // 只有当解析结果对应的正是当前文本时才展示，避免内容改动后仍显示过期结构。
  const parsed = parseState && parseState.source === text ? parseState.result : null;
  const error: JsonErrorInfo | null = parsed && !parsed.ok ? parsed.error : null;

  const lineNumbers = useMemo(() => {
    const total = Math.min(countLines(text), 5000);
    const lines: string[] = [];
    for (let i = 1; i <= total; i += 1) {
      lines.push(String(i));
    }
    return lines.join("\n");
  }, [text]);

  const handleScroll = useCallback(() => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  /** 把光标定位到出错的字符上。 */
  const locateError = useCallback((info: JsonErrorInfo) => {
    const area = textareaRef.current;
    if (!area) {
      return;
    }
    area.focus();
    area.setSelectionRange(info.position, Math.min(info.position + 1, area.value.length));
  }, []);

  const applyResult = useCallback(
    (result: JsonParseResult, onSuccess: (value: unknown) => void, successMessage: string) => {
      if (result.ok) {
        onSuccess(result.value);
        setStatus({ kind: "success", message: successMessage });
        return;
      }
      setParseState({ source: text, result });
      setStatus({
        kind: "error",
        message: `第 ${result.error.line} 行，第 ${result.error.column} 列：${result.error.message}`,
      });
      locateError(result.error);
    },
    [locateError, text],
  );

  const handleFormat = useCallback(() => {
    const result = parseJsonStrict(text);
    if (!result.ok) {
      applyResult(result, () => undefined, "");
      return;
    }
    const formatted = formatJsonValue(result.value, indent);
    setText(formatted);
    setParseState({ source: formatted, result: { ok: true, value: result.value } });
    setStatus({
      kind: "success",
      message: indent === "\t" ? "已使用 Tab 缩进格式化" : `已使用 ${indent} 空格缩进格式化`,
    });
  }, [applyResult, indent, text]);

  const handleMinify = useCallback(() => {
    const result = parseJsonStrict(text);
    if (!result.ok) {
      applyResult(result, () => undefined, "");
      return;
    }
    const minified = minifyJsonValue(result.value);
    setText(minified);
    setParseState({ source: minified, result: { ok: true, value: result.value } });
    setStatus({ kind: "success", message: "已压缩为单行 JSON" });
  }, [applyResult, text]);

  const handleValidate = useCallback(() => {
    const result = parseJsonStrict(text);
    setParseState({ source: text, result });
    if (result.ok) {
      setStatus({ kind: "success", message: "JSON 格式正确" });
      return;
    }
    setStatus({
      kind: "error",
      message: `第 ${result.error.line} 行，第 ${result.error.column} 列：${result.error.message}`,
    });
    locateError(result.error);
  }, [locateError, text]);

  const handleClear = useCallback(() => {
    setText("");
    setParseState(null);
    setStatus({ kind: "info", message: "已清空输入" });
    textareaRef.current?.focus();
  }, []);

  const handleCopy = useCallback(async () => {
    if (text.length === 0) {
      setStatus({ kind: "error", message: "没有可复制的内容" });
      return;
    }
    const copied = await copyToClipboard(text);
    if (copied) {
      setStatus({ kind: "success", message: "已复制到剪贴板" });
      return;
    }
    setStatus({ kind: "error", message: "复制失败，请手动选中文本后复制" });
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, [text]);

  const handleDownload = useCallback(() => {
    if (text.trim().length === 0) {
      setStatus({ kind: "error", message: "没有可下载的内容" });
      return;
    }
    const blob = new Blob([text], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, "toolora.json");
    setStatus({ kind: "success", message: "已导出 toolora.json" });
  }, [text]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size === 0) {
      setStatus({ kind: "error", message: "文件为空，请选择包含 JSON 内容的文件" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      setText(content);
      setStatus({ kind: "info", message: `已导入 ${file.name}` });
    };
    reader.onerror = () => {
      setStatus({ kind: "error", message: "读取文件失败，请重试" });
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const toggleNode = useCallback((path: string) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const statusStyle = {
    success: "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    error: "border-red-200/80 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300",
    info: "border-border bg-muted/40 text-muted-foreground",
  } as const;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>JSON 工作区</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={handleFormat}>
              <WrapText aria-hidden="true" />
              格式化
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleMinify}>
              <Minimize2 aria-hidden="true" />
              压缩
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleValidate}>
              <Check aria-hidden="true" />
              校验
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              <Eraser aria-hidden="true" />
              清空
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  缩进
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setIndent(2)}>2 空格</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIndent(4)}>4 空格</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIndent("\t")}>Tab</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileUp aria-hidden="true" />
              导入
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
              <Copy aria-hidden="true" />
              复制
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleDownload}>
              <Download aria-hidden="true" />
              下载
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json,text/plain"
              className="hidden"
              onChange={handleImport}
              aria-label="导入 JSON 文件"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {status ? (
          <div
            role="status"
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
              statusStyle[status.kind],
            )}
          >
            {status.kind === "error" ? (
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : null}
            <span className="min-w-0 flex-1">{status.message}</span>
            {error ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => locateError(error)}
                className="h-6 shrink-0 px-1.5 text-xs"
              >
                <Crosshair aria-hidden="true" />
                定位
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Braces className="size-3.5" aria-hidden="true" />
                输入
              </span>
              {error ? (
                <Badge variant="outline" className="border-red-200/80 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
                  格式错误
                </Badge>
              ) : parsed ? (
                <Badge variant="outline" className="border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                  格式正确
                </Badge>
              ) : null}
            </div>
            <div className="grid grid-cols-[auto_1fr] bg-card">
              <pre
                ref={gutterRef}
                aria-hidden="true"
                className="max-h-[420px] overflow-hidden border-r border-border bg-muted/30 px-3 py-3 text-right font-mono text-xs leading-5 text-muted-foreground/60"
              >
                {lineNumbers}
              </pre>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onScroll={handleScroll}
                spellCheck={false}
                wrap="off"
                aria-label="JSON 输入"
                placeholder={'粘贴或输入 JSON，例如：{"name": "Toolora"}'}
                className="max-h-[420px] w-full resize-none bg-transparent px-3 py-3 font-mono text-xs leading-5 text-foreground/90 outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            {error ? (
              <div className="flex items-start gap-2 border-t border-border bg-red-50/70 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  第 {error.line} 行，第 {error.column} 列：{error.message}
                </span>
                <button
                  type="button"
                  onClick={() => locateError(error)}
                  className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium hover:bg-red-100/70 dark:hover:bg-red-500/20"
                >
                  <Crosshair className="size-3" aria-hidden="true" />
                  定位
                </button>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Braces className="size-3.5" aria-hidden="true" />
                树形视图
              </span>
              {parsed?.ok ? (
                <span className="text-[11px] text-muted-foreground">点击节点可折叠 / 展开</span>
              ) : null}
            </div>
            <div className="max-h-[420px] overflow-auto bg-card px-3 py-3 font-mono text-xs">
              {parsed?.ok ? (
                <ul>
                  <JsonTree
                    value={parsed.value}
                    path="$"
                    depth={0}
                    collapsed={collapsed}
                    onToggle={toggleNode}
                  />
                </ul>
              ) : error ? (
                <p className="py-6 text-center font-sans text-sm text-muted-foreground">
                  JSON 无法解析，修正错误后这里会显示结构。
                </p>
              ) : (
                <p className="py-6 text-center font-sans text-sm text-muted-foreground">
                  输入合法 JSON 后，这里会显示可折叠的树形结构。
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
