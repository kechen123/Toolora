"use client";

import { cn } from "cn";
import {
  Download,
  ImageUp,
  Loader2,
  MoveHorizontal,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collectObjectUrls, downloadBlob, formatBytes, uniqueFilename } from "@/lib/file-utils";
import {
  MAX_FILE_COUNT,
  MAX_TOTAL_SIZE,
  compressionRate,
  validateImageFile,
  type CompressionOptions,
  type OutputFormat,
} from "@/tools/image-compress/compress";

type Mode = "single" | "batch";
type ItemStatus = "pending" | "processing" | "done" | "error";

interface ImageResult {
  blob: Blob;
  url: string;
  size: number;
  filename: string;
  type: string;
  keptOriginal: boolean;
  grew: boolean;
}

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  status: ItemStatus;
  result?: ImageResult;
  error?: string;
}

const qualityPresets = [
  { value: 0.5, label: "低", hint: "50%" },
  { value: 0.7, label: "中", hint: "70%" },
  { value: 0.85, label: "高", hint: "85%" },
  { value: 0.95, label: "最高", hint: "95%" },
];

const formatOptions: Array<{ value: OutputFormat; label: string }> = [
  { value: "image/jpeg", label: "JPG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
];

/** 把底层报错转换成用户能理解的中文提示。 */
function describeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error) {
    return error;
  }
  return "处理失败，请重试";
}

/** 图片压缩的主操作区：上传 + 参数设置 + 原图/结果对比。 */
export function ImageWorkspace() {
  const [mode, setMode] = useState<Mode>("single");
  const [items, setItems] = useState<ImageItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [split, setSplit] = useState(50);
  const [notice, setNotice] = useState<string | null>(null);

  const [method, setMethod] = useState<"quality" | "size">("quality");
  const [quality, setQuality] = useState(0.7);
  const [targetSizeMB, setTargetSizeMB] = useState(1);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [maxDimension, setMaxDimension] = useState(0);
  const [preserveExif, setPreserveExif] = useState(false);

  const urlsRef = useRef<string[]>([]);
  const liveIdsRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // 记录仍然存在的图片，用于丢弃「已被替换或移除」的那一次压缩结果。
  useEffect(() => {
    liveIdsRef.current = new Set(items.map((item) => item.id));
  }, [items]);

  /**
   * 精确释放指定的 Object URL。
   *
   * 必须精确到具体资源：把整个登记表一起释放会连带释放刚创建的预览地址，
   * 导致新图预览失效。
   */
  const releaseUrls = useCallback((urls: string[]) => {
    if (urls.length === 0) {
      return;
    }
    for (const url of urls) {
      URL.revokeObjectURL(url);
    }
    const released = new Set(urls);
    urlsRef.current = urlsRef.current.filter((url) => !released.has(url));
  }, []);

  // 卸载时统一释放 Object URL，避免批量处理后占用内存。
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
      urls.length = 0;
    };
  }, []);

  const settings = useMemo<CompressionOptions>(
    () => ({
      quality,
      targetSizeMB: method === "size" ? Math.max(0.1, targetSizeMB) : undefined,
      format,
      maxDimension: maxDimension > 0 ? maxDimension : undefined,
      preserveExif,
    }),
    [format, maxDimension, method, preserveExif, quality, targetSizeMB],
  );

  const runCompression = useCallback(
    async (targets: Array<{ id: string; file: File }>, options: CompressionOptions) => {
      if (targets.length === 0) {
        return;
      }
      setBusy(true);
      for (const target of targets) {
        setItems((previous) =>
          previous.map((item) =>
            item.id === target.id ? { ...item, status: "processing", error: undefined } : item,
          ),
        );
        try {
          // 按需加载压缩实现：只有真正开始压缩时才会下载这段代码。
          const { compressImage } = await import("@/tools/image-compress/compress");
          const result = await compressImage(target.file, options);
          if (!liveIdsRef.current.has(target.id)) {
            // 这张图片已经被移除或替换，结果直接丢弃，不创建多余的预览地址。
            continue;
          }
          const url = URL.createObjectURL(result.blob);
          urlsRef.current.push(url);
          // 重新压缩会替换掉上一次的结果，需要释放旧的预览地址。
          let staleResultUrl: string | undefined;
          setItems((previous) =>
            previous.map((item) => {
              if (item.id !== target.id) {
                return item;
              }
              staleResultUrl = item.result?.url;
              return {
                ...item,
                status: "done",
                result: {
                  blob: result.blob,
                  url,
                  size: result.size,
                  filename: result.filename,
                  type: result.type,
                  keptOriginal: result.keptOriginal,
                  grew: result.grew,
                },
              };
            }),
          );
          if (staleResultUrl) {
            releaseUrls([staleResultUrl]);
          }
        } catch (error) {
          // 失败时保留原文件，只记录错误信息，页面其余部分不受影响。
          setItems((previous) =>
            previous.map((item) =>
              item.id === target.id
                ? { ...item, status: "error", error: describeError(error) }
                : item,
            ),
          );
        }
      }
      setBusy(false);
    },
    [releaseUrls],
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) {
        return;
      }
      if (mode === "batch" && items.length + files.length > MAX_FILE_COUNT) {
        setNotice(`一次最多处理 ${MAX_FILE_COUNT} 张图片`);
        return;
      }

      const accepted: ImageItem[] = [];
      const rejected: string[] = [];
      let totalSize = items.reduce((sum, item) => sum + item.originalSize, 0);

      for (const file of files) {
        const problem = validateImageFile(file);
        if (problem) {
          rejected.push(`${file.name}：${problem}`);
          continue;
        }
        if (totalSize + file.size > MAX_TOTAL_SIZE) {
          rejected.push(`${file.name}：超出本次处理的总体积上限 ${formatBytes(MAX_TOTAL_SIZE)}`);
          continue;
        }
        totalSize += file.size;
        const url = URL.createObjectURL(file);
        urlsRef.current.push(url);
        accepted.push({
          id: `${file.name}-${file.size}-${Date.now()}-${accepted.length}`,
          file,
          originalUrl: url,
          originalSize: file.size,
          status: "pending",
        });
      }

      if (accepted.length === 0) {
        // 全部被拒绝时保留原有内容，只提示原因。
        setNotice(rejected[0] ?? "没有可添加的图片");
        return;
      }

      if (mode === "single") {
        // 单图模式只保留一张：校验通过后再替换上一张，避免选错文件时丢掉正在处理的图片。
        // 只释放旧图与旧结果的地址，新图刚创建的预览地址必须保留。
        releaseUrls(
          collectObjectUrls(items.flatMap((item) => [item.originalUrl, item.result?.url])),
        );
        setItems([]);
        setActiveId(null);
      }

      setItems((previous) => [...previous, ...accepted]);
      setActiveId((previous) => previous ?? accepted[0]?.id ?? null);
      setNotice(rejected.length > 0 ? rejected.join("；") : null);

      void runCompression(
        accepted.map((item) => ({ id: item.id, file: item.file })),
        settings,
      );
    },
    [items, mode, releaseUrls, runCompression, settings],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((previous) => {
        const target = previous.find((item) => item.id === id);
        if (target) {
          releaseUrls(collectObjectUrls([target.originalUrl, target.result?.url]));
        }
        return previous.filter((item) => item.id !== id);
      });
      setActiveId((previous) => (previous === id ? null : previous));
    },
    [releaseUrls],
  );

  const clearAll = useCallback(() => {
    releaseUrls([...urlsRef.current]);
    setItems([]);
    setActiveId(null);
    setNotice(null);
  }, [releaseUrls]);

  const recompressAll = useCallback(() => {
    const targets = items
      .filter((item) => item.status !== "processing")
      .map((item) => ({ id: item.id, file: item.file }));
    if (targets.length === 0) {
      setNotice("没有可以重新压缩的图片");
      return;
    }
    void runCompression(targets, settings);
  }, [items, runCompression, settings]);

  const downloadItem = useCallback((item: ImageItem) => {
    if (item.result) {
      downloadBlob(item.result.blob, item.result.filename);
      return;
    }
    // 处理失败时仍允许下载原文件。
    downloadBlob(item.file, item.file.name);
  }, []);

  const downloadAll = useCallback(() => {
    const ready = items.filter((item) => item.result);
    if (ready.length === 0) {
      setNotice("没有可下载的结果");
      return;
    }
    const taken = new Set<string>();
    ready.forEach((item, index) => {
      const filename = uniqueFilename(item.result?.filename ?? item.file.name, taken);
      window.setTimeout(() => {
        downloadBlob(item.result?.blob ?? item.file, filename);
      }, index * 300);
    });
    setNotice(`已依次下载 ${ready.length} 个文件（浏览器可能询问是否允许下载多个文件）`);
  }, [items]);

  const activeItem = items.find((item) => item.id === activeId) ?? items[0];
  const doneItems = items.filter((item) => item.status === "done" && item.result);
  const totalOriginal = doneItems.reduce((sum, item) => sum + item.originalSize, 0);
  const totalResult = doneItems.reduce((sum, item) => sum + (item.result?.size ?? 0), 0);
  const overallRate = totalOriginal > 0 ? compressionRate(totalOriginal, totalResult) : null;

  // 分屏对比的拖动逻辑。
  const startDrag = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const onMove = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0) {
        return;
      }
      const percent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setSplit(Math.min(100, Math.max(0, percent)));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  const dropZone = (multiple: boolean, hint: string) => (
    <ImageDropZone
      multiple={multiple}
      hint={hint}
      disabled={busy}
      onFiles={addFiles}
    />
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>压缩设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
            <TabsList>
              <TabsTrigger value="single">单图处理</TabsTrigger>
              <TabsTrigger value="batch">批量处理</TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="mt-4">
              {dropZone(false, "支持 JPG、PNG、WebP，单次处理一张")}
            </TabsContent>
            <TabsContent value="batch" className="mt-4">
              {dropZone(true, "可一次选择多张图片，压缩后逐个下载")}
            </TabsContent>
          </Tabs>

          <div>
            <p className="mb-2.5 text-sm font-medium">压缩方式</p>
            <RadioGroup
              value={method}
              onValueChange={(value) => setMethod(value as "quality" | "size")}
              className="grid grid-cols-2 gap-2"
              aria-label="压缩方式"
            >
              <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-2 text-sm">
                <RadioGroupItem value="quality" />
                按质量
              </Label>
              <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-2 text-sm">
                <RadioGroupItem value="size" />
                按目标大小
              </Label>
            </RadioGroup>
          </div>

          {method === "quality" ? (
            <div>
              <p className="mb-2.5 text-sm font-medium">压缩质量</p>
              <div className="grid grid-cols-4 gap-2">
                {qualityPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setQuality(preset.value)}
                    aria-pressed={quality === preset.value}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm transition-colors",
                      quality === preset.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="block leading-tight">{preset.label}</span>
                    <span className="block text-[11px] opacity-80">{preset.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="image-target-size" className="mb-2 block text-sm font-medium">
                目标大小（MB）
              </Label>
              <Input
                id="image-target-size"
                type="number"
                min={0.1}
                step={0.1}
                value={targetSizeMB}
                onChange={(event) => setTargetSizeMB(Number(event.target.value) || 0.1)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                会自动调整压缩质量，尽量让结果不超过该体积。
              </p>
            </div>
          )}

          <div>
            <p className="mb-2.5 text-sm font-medium">输出格式</p>
            <div className="grid grid-cols-3 gap-2">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormat(option.value)}
                  aria-pressed={format === option.value}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-sm transition-colors",
                    format === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              转为 JPG 时透明区域会填充为白色。
            </p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced" className="border-border">
              <AccordionTrigger className="text-sm">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  高级设置
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div>
                  <Label htmlFor="image-max-dimension" className="mb-1.5 block text-xs text-muted-foreground">
                    最大边长（像素，0 表示不限制）
                  </Label>
                  <Input
                    id="image-max-dimension"
                    type="number"
                    min={0}
                    step={100}
                    value={maxDimension}
                    onChange={(event) => setMaxDimension(Math.max(0, Number(event.target.value) || 0))}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={preserveExif}
                    onChange={(event) => setPreserveExif(event.target.checked)}
                    className="size-3.5 accent-[var(--primary)]"
                  />
                  保留 EXIF 信息（拍摄参数等）
                </label>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={recompressAll} disabled={busy || items.length === 0}>
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
            重新压缩
          </Button>
          <Button type="button" variant="ghost" onClick={clearAll} disabled={busy || items.length === 0}>
            <Trash2 aria-hidden="true" />
            清空
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>压缩结果</CardTitle>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {overallRate === null ? "压缩率 —" : `压缩率 ${overallRate}%`}
          </span>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {notice ? (
            <p role="status" className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
              {notice}
            </p>
          ) : null}

          {items.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center">
              <p className="text-sm font-medium">还没有添加图片</p>
              <p className="text-xs text-muted-foreground">
                在左侧点击选择或直接拖入图片，即可开始压缩。
              </p>
            </div>
          ) : mode === "single" && activeItem ? (
            <div className="space-y-3">
              <div
                ref={containerRef}
                className="relative aspect-[16/10] select-none overflow-hidden rounded-xl border border-border bg-muted/25"
              >
                {activeItem.result ? (
                  <>
                    <Image
                      src={activeItem.result.url}
                      alt="压缩结果预览"
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-contain"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                    >
                      <Image
                        src={activeItem.originalUrl}
                        alt="原图预览"
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-contain"
                      />
                    </div>
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 w-0.5 bg-primary"
                      style={{ left: `${split}%` }}
                    />
                    <button
                      type="button"
                      onPointerDown={startDrag}
                      aria-label="拖动对比原图与压缩结果"
                      className="absolute top-1/2 inline-flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm"
                    >
                      <MoveHorizontal className="size-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
                    <p className="text-sm font-medium">
                      {activeItem.status === "processing" ? "正在压缩…" : "暂无压缩结果"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeItem.error ?? "处理完成后会显示原图与结果的对比。"}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">原图</p>
                  <p className="text-sm font-medium">{formatBytes(activeItem.originalSize)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">压缩后</p>
                  <p className="text-sm font-medium">
                    {activeItem.result ? formatBytes(activeItem.result.size) : "—"}
                  </p>
                </div>
              </div>

              {activeItem.result?.keptOriginal ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                  重新编码后体积没有变小，已保留原文件（格式不变）。换一种输出格式或降低质量通常能获得更小的体积。
                </p>
              ) : null}

              {activeItem.result?.grew ? (
                <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                  已按你选择的输出格式转换，但转换后体积反而变大（
                  {formatBytes(activeItem.originalSize)} → {formatBytes(activeItem.result.size)}）。
                  PNG 等无损格式通常比原图更大，若想减小体积请选择 JPG 或 WebP。
                </p>
              ) : null}

              {activeItem.error ? (
                <p className="rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
                  {activeItem.error}
                </p>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border px-3 py-2",
                    item.id === activeId && "border-primary/40 bg-primary/5",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40"
                    aria-label={`查看 ${item.file.name}`}
                  >
                    <Image
                      src={item.originalUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.status === "processing"
                        ? "正在压缩…"
                        : item.status === "error"
                          ? item.error
                          : item.result
                            ? `${formatBytes(item.originalSize)} → ${formatBytes(item.result.size)}（${compressionRate(item.originalSize, item.result.size)}%）`
                            : formatBytes(item.originalSize)}
                    </p>
                  </div>
                  {item.status === "done" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`下载 ${item.file.name}`}
                      onClick={() => downloadItem(item)}
                    >
                      <Download aria-hidden="true" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`移除 ${item.file.name}`}
                    onClick={() => removeItem(item.id)}
                    disabled={busy}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            type="button"
            className="flex-1"
            disabled={busy || !activeItem}
            onClick={() => activeItem && downloadItem(activeItem)}
          >
            <Download aria-hidden="true" />
            {mode === "batch" ? "下载当前图片" : "下载图片"}
          </Button>
          {mode === "batch" ? (
            <Button type="button" variant="outline" disabled={busy || doneItems.length === 0} onClick={downloadAll}>
              <Download aria-hidden="true" />
              下载全部
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}

/** 支持点击选择与拖拽添加的上传区域。 */
function ImageDropZone({
  multiple,
  hint,
  disabled,
  onFiles,
}: {
  multiple: boolean;
  hint: string;
  disabled: boolean;
  onFiles: (files: FileList | File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled && event.dataTransfer.files.length > 0) {
          onFiles(event.dataTransfer.files);
        }
      }}
      data-dropzone="image"
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30",
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <UploadCloud className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium">拖拽图片到此处，或点击上传</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
        <ImageUp aria-hidden="true" />
        选择图片
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        aria-label="选择图片文件"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) {
            onFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />
    </div>
  );
}
