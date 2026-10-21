"use client";

import { cn } from "cn";
import {
  ArrowDown,
  ArrowUp,
  FileUp,
  GripVertical,
  Loader2,
  Merge,
  Trash2,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob, formatBytes } from "@/lib/file-utils";
import {
  MAX_FILE_COUNT,
  MAX_TOTAL_SIZE,
  ensurePdfExtension,
  validatePdfFile,
} from "@/tools/pdf-merge/merge";

type ItemStatus = "loading" | "ready" | "error";

interface PdfItem {
  id: string;
  file: File;
  size: number;
  status: ItemStatus;
  pageCount?: number;
  error?: string;
}

type Status = { kind: "success" | "error" | "info"; message: string } | null;

/** PDF 合并的主操作区：文件添加 + 排序 + 文件列表 + 合并。 */
export function PdfWorkspace() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [outputName, setOutputName] = useState("合并后的文件.pdf");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readyItems = useMemo(() => items.filter((item) => item.status === "ready"), [items]);
  const totalPages = useMemo(
    () => readyItems.reduce((sum, item) => sum + (item.pageCount ?? 0), 0),
    [readyItems],
  );

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) {
        return;
      }
      const currentSize = items.reduce((sum, item) => sum + item.size, 0);
      if (items.length + files.length > MAX_FILE_COUNT) {
        setStatus({ kind: "error", message: `一次最多合并 ${MAX_FILE_COUNT} 个 PDF` });
        return;
      }

      const accepted: PdfItem[] = [];
      const rejected: string[] = [];
      let size = currentSize;

      for (const file of files) {
        const problem = validatePdfFile(file);
        if (problem) {
          rejected.push(`${file.name}：${problem}`);
          continue;
        }
        if (size + file.size > MAX_TOTAL_SIZE) {
          rejected.push(`${file.name}：超出总体积上限 ${formatBytes(MAX_TOTAL_SIZE)}`);
          continue;
        }
        size += file.size;
        accepted.push({
          id: `${file.name}-${file.size}-${Date.now()}-${accepted.length}`,
          file,
          size: file.size,
          status: "loading",
        });
      }

      if (accepted.length === 0) {
        setStatus({ kind: "error", message: rejected[0] ?? "没有可添加的 PDF" });
        return;
      }

      setItems((previous) => [...previous, ...accepted]);
      if (rejected.length > 0) {
        setStatus({ kind: "error", message: rejected.join("；") });
      }

      // 逐个解析页数，单个文件出错不影响其它文件。
      let inspectPdf: (file: File) => Promise<number>;
      try {
        ({ inspectPdf } = await import("@/tools/pdf-merge/merge"));
      } catch {
        // 处理模块加载失败时必须收敛到可见的错误状态，不能一直停在「正在解析」。
        const failedIds = new Set(accepted.map((item) => item.id));
        setItems((previous) =>
          previous.map((current) =>
            failedIds.has(current.id)
              ? { ...current, status: "error", error: "PDF 处理模块加载失败，请刷新页面后重试" }
              : current,
          ),
        );
        setStatus({ kind: "error", message: "PDF 处理模块加载失败，请刷新页面后重试" });
        return;
      }

      for (const item of accepted) {
        // 用 Promise.resolve 包一层，保证同步抛出的异常也会走 catch，状态一定能收敛。
        void Promise.resolve()
          .then(() => inspectPdf(item.file))
          .then((pageCount) => {
            setItems((previous) =>
              previous.map((current) =>
                current.id === item.id ? { ...current, status: "ready", pageCount } : current,
              ),
            );
          })
          .catch((error: unknown) => {
            setItems((previous) =>
              previous.map((current) =>
                current.id === item.id
                  ? {
                      ...current,
                      status: "error",
                      error: error instanceof Error ? error.message : "文件解析失败",
                    }
                  : current,
              ),
            );
          });
      }
    },
    [items],
  );

  const removeItem = useCallback((id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const moveItem = useCallback((id: string, offset: number) => {
    setItems((previous) => {
      const index = previous.findIndex((item) => item.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= previous.length) {
        return previous;
      }
      const next = [...previous];
      const moved = next[index];
      if (!moved) {
        return previous;
      }
      next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const reorderTo = useCallback((fromId: string, toId: string) => {
    setItems((previous) => {
      const fromIndex = previous.findIndex((item) => item.id === fromId);
      if (fromIndex < 0) {
        return previous;
      }
      const next = [...previous];
      const moved = next[fromIndex];
      if (!moved) {
        return previous;
      }
      next.splice(fromIndex, 1);
      const targetIndex = next.findIndex((item) => item.id === toId);
      if (targetIndex < 0) {
        next.splice(fromIndex, 0, moved);
        return next;
      }
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }, []);

  const handleMerge = useCallback(async () => {
    if (readyItems.length === 0) {
      setStatus({ kind: "error", message: "没有可合并的文件，请先添加有效的 PDF" });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const { mergePdfs } = await import("@/tools/pdf-merge/merge");
      const bytes = await mergePdfs(readyItems.map((item) => item.file));
      // 复制到独立的 ArrayBuffer，避免把可能带偏移的视图直接交给 Blob。
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      const blob = new Blob([buffer], { type: "application/pdf" });
      downloadBlob(blob, ensurePdfExtension(outputName));
      setStatus({
        kind: "success",
        message: `已合并 ${readyItems.length} 个文件，共 ${totalPages} 页`,
      });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "合并失败，请重试",
      });
    } finally {
      setBusy(false);
    }
  }, [outputName, readyItems, totalPages]);

  const statusStyle = {
    success:
      "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    error:
      "border-red-200/80 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300",
    info: "border-border bg-muted/40 text-muted-foreground",
  } as const;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>添加文件</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (!busy && event.dataTransfer.files.length > 0) {
                addFiles(event.dataTransfer.files);
              }
            }}
            data-dropzone="pdf"
            className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 text-center"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UploadCloud className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium">点击上传或拖拽 PDF 文件到此处</p>
              <p className="mt-1 text-xs text-muted-foreground">
                支持一次选择多个 PDF，合并顺序可以在右侧调整
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp aria-hidden="true" />
              选择文件
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              aria-label="选择 PDF 文件"
              onChange={(event) => {
                if (event.target.files && event.target.files.length > 0) {
                  addFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
          </div>

          <div>
            <Label htmlFor="pdf-output-name" className="mb-2 block text-sm font-medium">
              输出文件名
            </Label>
            <Input
              id="pdf-output-name"
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              placeholder="合并后的文件.pdf"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              未填写扩展名时会自动补上 .pdf。
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            className="w-full"
            disabled={busy || readyItems.length === 0}
            onClick={handleMerge}
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Merge aria-hidden="true" />}
            {busy ? "正在合并…" : "开始合并"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>文件列表</CardTitle>
          {readyItems.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {readyItems.length} 个文件 · 共 {totalPages} 页
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
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
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
              <p className="text-sm font-medium">还没有添加文件</p>
              <p className="text-xs text-muted-foreground">
                添加 PDF 后，文件会显示在这里，并可以拖动手柄调整合并顺序。
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  draggable={!busy}
                  onDragStart={() => setDragId(item.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOverId(item.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (dragId && dragId !== item.id) {
                      reorderTo(dragId, item.id);
                    }
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 transition-colors",
                    overId === item.id ? "border-primary" : "border-border",
                    dragId === item.id && "opacity-60",
                  )}
                >
                  <span
                    className="cursor-grab text-muted-foreground"
                    aria-hidden="true"
                    title="拖动可调整顺序"
                  >
                    <GripVertical className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.status === "loading"
                        ? "正在解析…"
                        : item.status === "error"
                          ? item.error
                          : `${formatBytes(item.size)} · ${item.pageCount} 页`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`上移 ${item.file.name}`}
                      disabled={busy || index === 0}
                      onClick={() => moveItem(item.id, -1)}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`下移 ${item.file.name}`}
                      disabled={busy || index === items.length - 1}
                      onClick={() => moveItem(item.id, 1)}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`删除 ${item.file.name}`}
                      disabled={busy}
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
