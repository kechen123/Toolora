import type { ReactNode } from "react";

/** 首页与列表页统一的区块标题。 */
export function SectionHeading({
  title,
  description,
  action,
  id,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** 标题元素的 id，便于外层 section 通过 aria-labelledby 关联。 */
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
