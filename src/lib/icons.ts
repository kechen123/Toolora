import { Braces, Code2, FileText, Image as ImageIcon } from "lucide-react";

/**
 * 全站图标表。
 *
 * 注册表只保存图标键而不是组件引用，这样工具数据在服务端与客户端之间
 * 可以安全序列化，工具卡片既能在服务端页面中使用，也能在客户端组件中使用。
 */
export const ICONS = {
  image: ImageIcon,
  code: Code2,
  braces: Braces,
  document: FileText,
} as const;

/** 图标键。 */
export type IconKey = keyof typeof ICONS;
