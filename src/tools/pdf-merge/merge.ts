import type { PDFDocument as PdfDocument } from "pdf-lib";

import { formatBytes } from "@/lib/file-utils";

/** 单个 PDF 文件大小上限：100 MB。 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/** 一次合并的总体积上限：300 MB。 */
export const MAX_TOTAL_SIZE = 300 * 1024 * 1024;

/** 一次合并的文件数量上限。 */
export const MAX_FILE_COUNT = 30;

/**
 * 校验单个 PDF 文件，返回错误信息；通过校验时返回 null。
 *
 * 只做体积与类型的快速判断，内容是否真的是 PDF 由文件头与解析结果确认。
 */
export function validatePdfFile(file: File): string | null {
  if (file.size === 0) {
    return "文件为空，请重新选择";
  }
  if (file.size > MAX_FILE_SIZE) {
    return `单个文件不能超过 ${formatBytes(MAX_FILE_SIZE)}，当前为 ${formatBytes(file.size)}`;
  }
  // 浏览器对拖拽进来的文件可能不给 MIME 类型，此时只能靠文件头判断。
  if (file.type && file.type !== "application/pdf") {
    return `不支持的文件类型（${file.type}），仅支持 PDF`;
  }
  return null;
}

/** 判断解析错误是否由加密引起。 */
function isEncryptionError(error: unknown): boolean {
  return error instanceof Error && /is encrypted/i.test(error.message);
}

/** 判断字节流是否以 `%PDF-` 开头（允许前面有少量空白）。 */
export function hasPdfHeader(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, 1024);
  for (let i = 0; i < limit; i += 1) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }
  return false;
}

/** 读取并解析单个 PDF，返回页数。 */
export async function inspectPdf(file: File): Promise<number> {
  if (file.size === 0) {
    throw new Error("文件为空，请重新选择");
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (!hasPdfHeader(bytes)) {
    throw new Error("不是有效的 PDF 文件");
  }
  try {
    // 按需加载 PDF 库：只有真正解析 PDF 时才会下载这段代码。
    const { PDFDocument } = await import("pdf-lib");
    // 不使用 ignoreEncryption：加密文件必须报错，而不是被强行处理。
    const document = await PDFDocument.load(bytes, { updateMetadata: false });
    if (document.isEncrypted) {
      throw new Error("该 PDF 已加密，请先在本地解除密码保护后再合并");
    }
    return document.getPageCount();
  } catch (error) {
    if (error instanceof Error && /已加密/.test(error.message)) {
      throw error;
    }
    if (isEncryptionError(error)) {
      throw new Error("该 PDF 已加密，请先在本地解除密码保护后再合并");
    }
    throw new Error("PDF 解析失败，文件可能已损坏");
  }
}

/**
 * 按给定顺序合并 PDF。
 *
 * 逐个读取源文件并复制页面，页面内容不会被重新编码。
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();
  let totalPages = 0;

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let source: PdfDocument;
    try {
      source = await PDFDocument.load(bytes, { updateMetadata: false });
    } catch (error) {
      if (isEncryptionError(error)) {
        throw new Error(`${file.name}：该 PDF 已加密，无法合并`);
      }
      throw new Error(`${file.name}：PDF 解析失败，文件可能已损坏`);
    }
    if (source.isEncrypted) {
      throw new Error(`${file.name}：该 PDF 已加密，无法合并`);
    }
    const pages = await merged.copyPages(source, source.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
    totalPages += pages.length;
  }

  if (totalPages === 0) {
    throw new Error("这些 PDF 里没有可合并的页面");
  }

  merged.setTitle("合并后的文档");
  merged.setProducer("Toolora");
  merged.setCreationDate(new Date());
  return merged.save();
}

/** 保证下载文件名以 `.pdf` 结尾。 */
export function ensurePdfExtension(filename: string): string {
  const trimmed = filename.trim() || "合并后的文件";
  return trimmed.toLowerCase().endsWith(".pdf") ? trimmed : `${trimmed}.pdf`;
}
