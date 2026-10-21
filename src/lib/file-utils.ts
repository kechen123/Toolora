/** 人类可读的字节数。 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

/**
 * 触发浏览器下载。
 *
 * Object URL 不能立即回收：部分浏览器在点击后才开始读取数据，
 * 立即 revoke 会导致下载得到空文件。
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** 保留主文件名并替换扩展名，例如 `photo.png` + `webp` → `photo.webp`。 */
export function replaceExtension(filename: string, extension: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "").trim();
  return `${base || "output"}.${extension}`;
}

/** 生成列表中不重复的文件名，避免批量下载时互相覆盖。 */
export function uniqueFilename(filename: string, taken: Set<string>): string {
  if (!taken.has(filename)) {
    taken.add(filename);
    return filename;
  }
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  const extension = dot > 0 ? filename.slice(dot) : "";
  let index = 2;
  let candidate = `${base}-${index}${extension}`;
  while (taken.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}${extension}`;
  }
  taken.add(candidate);
  return candidate;
}

/**
 * 从一组可能是 undefined 的地址中挑出真正需要释放的 Object URL。
 *
 * 释放时必须精确到具体资源：把整个登记表一起释放会连带释放刚创建的预览地址，
 * 导致新图预览失效。
 */
export function collectObjectUrls(urls: Array<string | null | undefined>): string[] {
  return urls.filter((url): url is string => typeof url === "string" && url.length > 0);
}
