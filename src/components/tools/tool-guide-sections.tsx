import { Check } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ToolGuide } from "@/types/tool";

/** 工具详情页正文：使用说明 + 功能特点 + 常见问题。 */
export function ToolGuideSections({ guide }: { guide: ToolGuide }) {
  return (
    <div className="space-y-12">
      <section aria-labelledby="usage-heading">
        <h2 id="usage-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
          使用说明
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {guide.steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
          功能特点
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guide.features.map((feature) => (
            <li key={feature.title} className="surface-card p-4">
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
          常见问题
        </h2>
        <Accordion type="single" collapsible className="mt-4">
          {guide.faq.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`} className="border-border">
              <AccordionTrigger className="text-sm">{item.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
