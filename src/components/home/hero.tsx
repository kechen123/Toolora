import {
  Braces,
  FileText,
  Image as ImageIcon,
  QrCode,
  Sparkles,
  Type,
} from "lucide-react";

import { ToolSearch } from "@/components/home/tool-search";

const decorations = [
  { Icon: ImageIcon, className: "left-2 top-8 -rotate-6", gradient: "from-emerald-400 to-teal-500" },
  { Icon: Braces, className: "left-[38%] top-0 rotate-6", gradient: "from-indigo-500 to-blue-500" },
  { Icon: FileText, className: "right-0 top-12 -rotate-3", gradient: "from-rose-400 to-orange-500" },
  { Icon: Type, className: "left-[16%] bottom-1 rotate-3", gradient: "from-violet-500 to-fuchsia-500" },
  { Icon: QrCode, className: "right-8 bottom-0 -rotate-6", gradient: "from-sky-400 to-cyan-500" },
  { Icon: Sparkles, className: "left-[46%] bottom-6 rotate-12", gradient: "from-amber-400 to-orange-500" },
];

/** 首页顶部的主视觉区域：品牌介绍 + 全站搜索。 */
export function Hero() {
  return (
    <section className="relative rounded-3xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50 via-violet-50 to-sky-50 px-6 py-10 sm:px-10 sm:py-14 dark:border-white/10 dark:from-indigo-950/70 dark:via-violet-950/50 dark:to-sky-950/50">
      {/* 装饰光斑单独裁切：section 本身不能裁切，否则会切掉搜索结果下拉框 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      >
        <div className="absolute -top-24 -left-16 size-64 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute -right-12 -bottom-24 size-72 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/20" />
      </div>

      <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-primary shadow-sm ring-1 ring-indigo-100 dark:bg-white/10 dark:text-indigo-200 dark:ring-white/10">
            高效 · 免费 · 无需登录 · 数据不上传
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[42px] lg:leading-[1.15]">
            好用的在线工具集合
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            简洁、强大、持续更新，帮助你轻松处理工作与生活中的各种问题。
          </p>

          <div className="mt-7 max-w-xl">
            <ToolSearch />
          </div>
        </div>

        <div aria-hidden="true" className="relative hidden h-[230px] lg:block">
          {decorations.map(({ Icon, className, gradient }, index) => (
            <span
              key={index}
              className={`absolute inline-flex size-14 animate-float items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-[0_18px_30px_-14px_rgb(15_23_42/0.55)] ring-1 ring-white/40 ${className}`}
              style={{ animationDelay: `${index * 0.6}s` }}
            >
              <Icon className="size-6" strokeWidth={2} />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
