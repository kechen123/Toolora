import { formatBytes, replaceExtension } from "@/lib/file-utils";

/**
 * worker 脚本的自托管地址。
 *
 * browser-image-compression 默认从 jsdelivr CDN 加载 worker，会产生外部网络请求；
 * 本站承诺所有处理都在本地完成，因此把 worker 随站点一起分发（见 scripts/sync-image-worker.mjs）。
 */
export const IMAGE_WORKER_URL = "/vendor/browser-image-compression.js";

/** 支持的图片类型。 */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type OutputFormat = (typeof ACCEPTED_IMAGE_TYPES)[number];

/** 单个文件大小上限：20 MB。 */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/** 一次批量处理的总大小上限：100 MB。 */
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

/** 一次批量处理的文件数量上限。 */
export const MAX_FILE_COUNT = 30;

const EXTENSION_TYPES: Record<string, OutputFormat> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** 输出格式对应的扩展名。 */
export function extensionForType(type: OutputFormat): string {
  if (type === "image/jpeg") {
    return "jpg";
  }
  if (type === "image/png") {
    return "png";
  }
  return "webp";
}

/**
 * 识别图片类型。
 *
 * 部分浏览器在拖拽文件时不会给出 MIME 类型，因此同时按扩展名判断。
 */
export function detectImageType(file: File): OutputFormat | null {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type as OutputFormat)) {
    return file.type as OutputFormat;
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? null;
}

/** 校验单个文件，返回错误信息；通过校验时返回 null。 */
export function validateImageFile(file: File): string | null {
  if (file.size === 0) {
    return "文件为空，请重新选择一张图片";
  }
  if (detectImageType(file) === null) {
    return `不支持的文件类型（${file.type || "未知"}），仅支持 JPG / PNG / WebP`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `单个文件不能超过 ${formatBytes(MAX_FILE_SIZE)}，当前为 ${formatBytes(file.size)}`;
  }
  return null;
}

/** 压缩参数。 */
export interface CompressionOptions {
  /** 质量模式下的压缩质量，取值 0.1 - 1。 */
  quality: number;
  /** 目标大小模式下的体积上限（MB）。 */
  targetSizeMB?: number;
  /** 输出格式。 */
  format: OutputFormat;
  /** 最大边长限制（像素），不限制时为 undefined。 */
  maxDimension?: number;
  /** 是否保留 EXIF 信息。 */
  preserveExif: boolean;
}

/** 压缩结果。 */
export interface CompressionResult {
  blob: Blob;
  size: number;
  filename: string;
  type: string;
  /** 交付的是原文件而不是重新编码的结果（仅在格式一致且重新编码没有变小时发生）。 */
  keptOriginal: boolean;
  /** 交付的文件比原图更大（例如转成 PNG 这类无损格式时）。 */
  grew: boolean;
}

/** 压缩结果的交付决策所需的输入。 */
export interface OutputDecisionInput {
  /** 原文件内容。 */
  originalBlob: Blob;
  /** 原文件体积。 */
  originalSize: number;
  /** 原文件的 MIME 类型。 */
  originalType: string;
  /** 原文件名。 */
  originalFilename: string;
  /** 重新编码后的内容。 */
  compressedBlob: Blob;
  /** 重新编码后的体积。 */
  compressedSize: number;
  /** 用户选择的输出格式。 */
  requestedType: OutputFormat;
}

/**
 * 决定最终交付哪个文件。
 *
 * 规则：
 * 1. 重新编码后更小 → 交付重新编码的结果，格式与用户选择一致。
 * 2. 重新编码后没有变小，但输出格式与原格式不同 → 仍交付重新编码的结果，
 *    保证「下载文件的实际格式 = 用户选择的格式」，并在界面上如实提示体积变大。
 * 3. 重新编码后没有变小，且输出格式与原格式相同 → 交付原文件（格式一致且体积更小），
 *    并在界面上说明原因。
 */
export function decideOutput(input: OutputDecisionInput): CompressionResult {
  const {
    originalBlob,
    originalSize,
    originalType,
    originalFilename,
    compressedBlob,
    compressedSize,
    requestedType,
  } = input;

  const requestedExtension = extensionForType(requestedType);
  const isSmaller = compressedSize < originalSize;
  const sameFormat = originalType === requestedType;

  if (isSmaller || !sameFormat) {
    return {
      blob: compressedBlob,
      size: compressedSize,
      filename: replaceExtension(originalFilename, requestedExtension),
      type: requestedType,
      keptOriginal: false,
      grew: !isSmaller,
    };
  }

  const originalExtension = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(originalType)
    ? extensionForType(originalType as OutputFormat)
    : requestedExtension;
  return {
    blob: originalBlob,
    size: originalSize,
    filename: replaceExtension(originalFilename, originalExtension),
    type: originalType,
    keptOriginal: true,
    grew: false,
  };
}

/** 取出错误对象里可读的错误文本（worker 传递过程中可能丢失 Error 的结构）。 */
function extractMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (error !== null && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

/**
 * 把压缩失败转换成可读的中文提示。
 *
 * 底层库在 worker 中处理图片，错误信息经过 worker 传递后可能只剩一个空对象，
 * 因此在拿不到明确原因时会主动判断文件能否被解码，从而给出准确的提示。
 */
async function describeCompressionError(file: File, error: unknown): Promise<string> {
  const raw = extractMessage(error);
  if (/decode|invalid image|not a valid|corrupt|bitmap/i.test(raw)) {
    return "图片解码失败，请确认文件完整，或换成其他图片再试";
  }
  if (/memory|allocation|out of memory/i.test(raw)) {
    return "图片过大，浏览器内存不足，请减少图片数量或降低图片分辨率";
  }
  if (raw) {
    return `压缩失败：${raw}`;
  }
  try {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return "压缩失败，请重试或换一张图片";
  } catch {
    return "图片解码失败，请确认文件完整，或换成其他图片再试";
  }
}

/**
 * 压缩单张图片。
 *
 * 全程在浏览器本地完成：解码、缩放与重新编码都由 canvas 完成，图片不会离开设备。
 * 最终交付哪个文件由 `decideOutput` 决定：格式始终与用户选择一致，
 * 体积是否变大会如实标记，由界面提示。
 */
export async function compressImage(
  file: File,
  options: CompressionOptions,
): Promise<CompressionResult> {
  let compressed: File;
  try {
    // 按需加载压缩库：只有真正开始压缩时才会下载这段代码。
    const { default: imageCompression } = await import("browser-image-compression");
    compressed = await imageCompression(file, {
      maxSizeMB: options.targetSizeMB ?? Number.POSITIVE_INFINITY,
      initialQuality: options.quality,
      fileType: options.format,
      maxWidthOrHeight: options.maxDimension,
      preserveExif: options.preserveExif,
      useWebWorker: true,
      libURL: IMAGE_WORKER_URL,
      maxIteration: 10,
      alwaysKeepResolution: false,
    });
  } catch (error) {
    throw new Error(await describeCompressionError(file, error));
  }

  return decideOutput({
    originalBlob: file,
    originalSize: file.size,
    originalType: detectImageType(file) ?? file.type,
    originalFilename: file.name,
    compressedBlob: compressed,
    compressedSize: compressed.size,
    requestedType: options.format,
  });
}

/** 计算压缩率（百分比，保留一位小数）。 */
export function compressionRate(originalSize: number, resultSize: number): number {
  if (originalSize <= 0) {
    return 0;
  }
  return Math.max(0, Math.round((1 - resultSize / originalSize) * 1000) / 10);
}
