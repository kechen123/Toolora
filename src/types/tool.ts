import type { IconKey } from "@/lib/icons";

/** 工具分类。分类由注册表驱动，导航、首页与分类页共用同一份数据。 */
export interface ToolCategory {
  /** URL slug，例如 `image-tools`。 */
  slug: string;
  /** 分类中文名称，例如「图片工具」。 */
  name: string;
  /** 分类页的可索引介绍文案。 */
  description: string;
  /** 分类覆盖场景的要点，用于分类页的可索引正文。 */
  highlights: string[];
  /** 分类图标键，组件从 `lib/icons.ts` 中解析。 */
  icon: IconKey;
  /** 分类辅助色标识，对应 `CATEGORY_ACCENT` 中的主题色。 */
  accent: CategoryAccent;
  /** 排序权重，数值越小越靠前。 */
  order: number;
}

/** 分类辅助色，仅允许使用已登记的主题色，保证 Tailwind 能静态收集到样式。 */
export type CategoryAccent = "emerald" | "indigo" | "rose";

/** 工具详情页主操作区的布局类型，每种工具使用各自适用的交互结构。 */
export type ToolWorkspace = "image" | "json" | "pdf";

/** 工具的完整元数据，注册表是全站唯一数据源。 */
export interface ToolDefinition {
  /** 唯一 ID。 */
  id: string;
  /** URL slug，例如 `image-compress`。 */
  slug: string;
  /** 工具名称。 */
  name: string;
  /** 卡片上的简短描述。 */
  shortDescription: string;
  /** 工具页顶部的完整描述。 */
  description: string;
  /** 所属分类的 slug。 */
  categorySlug: string;
  /** 工具图标键，组件从 `lib/icons.ts` 中解析。 */
  icon: IconKey;
  /** 搜索关键词，覆盖中文名、英文名与常见别名。 */
  keywords: string[];
  /** 是否出现在「热门工具」中。 */
  popular: boolean;
  /** 是否属于「常用工具」。 */
  featured: boolean;
  /** 最近更新时间（ISO 日期）。 */
  updatedAt: string;
  /** 主操作区布局。 */
  workspace: ToolWorkspace;
  /** 独立的 SEO 元数据。 */
  seo: {
    title: string;
    description: string;
  };
}

/**
 * 工具详情页的正文内容，与工具实现分离，便于独立维护与后续测试。
 */
export interface ToolGuide {
  /** 使用说明的步骤列表。 */
  steps: Array<{
    title: string;
    description: string;
  }>;
  /** 功能特点。 */
  features: Array<{
    title: string;
    description: string;
  }>;
  /** 常见问题。 */
  faq: Array<{
    question: string;
    answer: string;
  }>;
}
