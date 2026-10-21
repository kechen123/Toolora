import type { CategoryAccent } from "@/types/tool";

/**
 * 分类辅助色。
 *
 * 分类图标使用柔和的同色系底色 + 彩色图标，与参考设计保持一致。
 * 这里是写死的完整类名字符串，Tailwind 才能静态收集到这些样式。
 */
export const CATEGORY_ACCENT: Record<
  CategoryAccent,
  { tile: string; icon: string; chip: string }
> = {
  emerald: {
    tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-400",
    chip: "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  indigo: {
    tile: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
    icon: "text-indigo-600 dark:text-indigo-400",
    chip: "border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300",
  },
  rose: {
    tile: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
    icon: "text-rose-600 dark:text-rose-400",
    chip: "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
  },
};
