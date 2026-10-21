import { categories } from "@/registry/categories";
import type { ToolCategory, ToolDefinition } from "@/types/tool";

/**
 * 工具注册表。
 *
 * 首页卡片、分类导航、搜索与静态路由全部由这份数据驱动。
 * 新增工具时，只需要在这里增加一条记录并实现对应的页面。
 */
export const tools: ToolDefinition[] = [
  {
    id: "tool-image-compress",
    slug: "image-compress",
    name: "图片压缩",
    shortDescription: "智能压缩图片体积，保持清晰度的同时减少文件大小。",
    description:
      "在浏览器本地压缩 JPG、PNG、WebP 等常见格式的图片，可按压缩质量或目标大小调节，并直观对比压缩前后的体积与画质差异。",
    categorySlug: "image-tools",
    icon: "image",
    keywords: [
      "图片压缩",
      "压缩图片",
      "图片瘦身",
      "image compress",
      "jpg 压缩",
      "png 压缩",
      "webp 压缩",
      "减小图片体积",
    ],
    popular: true,
    featured: true,
    updatedAt: "2026-10-20",
    workspace: "image",
    seo: {
      title: "图片压缩 - 在线压缩图片体积",
      description:
        "免费在线图片压缩工具：按质量或目标大小压缩图片，实时对比压缩率与画质，全程浏览器本地处理，图片不上传服务器。",
    },
  },
  {
    id: "tool-json-formatter",
    slug: "json-formatter",
    name: "JSON 格式化",
    shortDescription: "格式化、校验、树形查看 JSON，支持压缩与错误定位。",
    description:
      "格式化与压缩 JSON 文本，快速定位语法错误，并以可折叠的树形结构查看嵌套层级，支持从文件导入与导出。",
    categorySlug: "developer-tools",
    icon: "braces",
    keywords: [
      "JSON 格式化",
      "JSON 美化",
      "JSON 校验",
      "JSON 压缩",
      "json format",
      "json pretty",
      "json validate",
      "json 树形",
    ],
    popular: true,
    featured: true,
    updatedAt: "2026-10-20",
    workspace: "json",
    seo: {
      title: "JSON 格式化 - 在线格式化与校验 JSON",
      description:
        "免费在线 JSON 格式化工具：格式化、压缩、校验 JSON，定位语法错误并以树形结构查看嵌套内容，支持文件导入导出与本地处理。",
    },
  },
  {
    id: "tool-pdf-merge",
    slug: "pdf-merge",
    name: "PDF 合并",
    shortDescription: "把多个 PDF 合并为一个文件，支持拖拽调整顺序。",
    description:
      "将多个 PDF 文件合并为一个文档，可拖拽或用按钮调整合并顺序，并直接下载合并后的结果。",
    categorySlug: "pdf-tools",
    icon: "document",
    keywords: [
      "PDF 合并",
      "合并 PDF",
      "PDF 拼接",
      "pdf merge",
      "pdf 合并工具",
      "pdf 整理",
    ],
    popular: true,
    featured: true,
    updatedAt: "2026-10-20",
    workspace: "pdf",
    seo: {
      title: "PDF 合并 - 在线合并多个 PDF 文件",
      description:
        "免费在线 PDF 合并工具：上传多个 PDF、拖拽调整顺序、合并为一个文件并下载，全程浏览器本地处理，文档不上传服务器。",
    },
  },
];

/** 按 slug 查找工具。 */
export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug);
}

/** 按 slug 查找分类。 */
export function getCategoryBySlug(slug: string): ToolCategory | undefined {
  return categories.find((category) => category.slug === slug);
}

/** 取某个分类下的全部工具，按注册顺序排列。 */
export function getToolsByCategory(categorySlug: string): ToolDefinition[] {
  return tools.filter((tool) => tool.categorySlug === categorySlug);
}

/** 取「热门工具」列表。 */
export function getPopularTools(): ToolDefinition[] {
  return tools.filter((tool) => tool.popular);
}

/** 取「常用工具」列表。 */
export function getFeaturedTools(): ToolDefinition[] {
  return tools.filter((tool) => tool.featured);
}

/**
 * 只保留至少含一个工具的分类。
 *
 * 侧边栏与首页分类区都使用该结果，避免出现指向空页面的导航项。
 */
export function getCategoriesWithTools(): Array<ToolCategory & { toolCount: number }> {
  return categories
    .map((category) => ({
      ...category,
      toolCount: getToolsByCategory(category.slug).length,
    }))
    .filter((category) => category.toolCount > 0)
    .sort((a, b) => a.order - b.order);
}

/**
 * 取与给定工具相关的其他工具：优先同分类，其次其他分类，用于工具页「相关工具」。
 */
export function getRelatedTools(tool: ToolDefinition, limit = 4): ToolDefinition[] {
  const sameCategory = tools.filter(
    (candidate) => candidate.slug !== tool.slug && candidate.categorySlug === tool.categorySlug,
  );
  const otherCategories = tools.filter(
    (candidate) => candidate.slug !== tool.slug && candidate.categorySlug !== tool.categorySlug,
  );

  return [...sameCategory, ...otherCategories].slice(0, limit);
}

/** 按更新时间倒序排列（同一日期保持注册顺序），用于「最近更新」。 */
export function getRecentlyUpdatedTools(limit?: number): ToolDefinition[] {
  const sorted = [...tools].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}
