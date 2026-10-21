import { Wrench } from "lucide-react";

import { cn } from "cn";

/** 品牌图标：蓝紫色渐变圆角方块 + 白色扳手。 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_6px_16px_-8px_rgb(99_102_241/0.85)]",
        className,
      )}
    >
      <Wrench className="size-[18px]" strokeWidth={2.2} />
    </span>
  );
}
