import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RelatedTools } from "@/components/tools/related-tools";
import { ToolGuideSections } from "@/components/tools/tool-guide-sections";
import { ToolPageHeader } from "@/components/tools/tool-page-header";
import { ToolWorkspaceArea } from "@/components/tools/tool-workspace";
import { getToolBySlug, tools } from "@/registry/tools";
import { getToolGuide } from "@/tools";

/** 只生成注册表中已登记的工具，未知 slug 直接 404。 */
export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return { title: "工具不存在" };
  }

  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: tool.keywords,
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      type: "article",
    },
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const guide = await getToolGuide(tool.slug);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <ToolPageHeader tool={tool} />

      <div className="mt-6">
        <ToolWorkspaceArea workspace={tool.workspace} />
      </div>

      {guide ? (
        <div className="mt-12 lg:mt-16">
          <ToolGuideSections guide={guide} />
        </div>
      ) : null}

      <div className="mt-12 lg:mt-16">
        <RelatedTools tool={tool} />
      </div>
    </div>
  );
}
