import type { ToolCategory } from "@/types/tool";

/**
 * 工具分类注册表。
 *
 * 侧边栏导航、首页「按分类浏览」与分类页全部从这里读取，
 * 不在组件里硬编码分类，避免导航与页面不同步。
 */
export const categories: ToolCategory[] = [
  {
    slug: "image-tools",
    name: "图片工具",
    description:
      "图片工具专注于浏览器本地的图片处理：压缩、格式转换、尺寸调整与裁剪等常见需求都可以直接完成，不需要注册，也不会把图片上传到任何服务器。",
    highlights: [
      "覆盖压缩、格式转换、尺寸调整、裁剪与加水印等日常图片需求",
      "所有处理都在浏览器本地完成，图片不会离开你的设备",
      "适合处理未公开的素材、截图与内部设计稿",
    ],
    icon: "image",
    accent: "emerald",
    order: 1,
  },
  {
    slug: "developer-tools",
    name: "开发工具",
    description:
      "开发工具面向日常的文本与数据处理场景，包括 JSON 格式化与校验、编码解码、时间戳转换等高频操作，帮助你更快定位并处理开发过程中的琐碎问题。",
    highlights: [
      "覆盖 JSON、编码、时间戳、正则与哈希等高频开发操作",
      "错误信息尽量定位到具体位置，减少来回排查的时间",
      "内容默认只在本地处理，可安全处理接口返回的敏感数据",
    ],
    icon: "code",
    accent: "indigo",
    order: 2,
  },
  {
    slug: "pdf-tools",
    name: "PDF 工具",
    description:
      "PDF 工具用于处理常见的文档合并、拆分与排序需求。所有处理都在你的浏览器里完成，文档内容不会离开本机，适合处理敏感的内部资料。",
    highlights: [
      "覆盖合并、拆分、页面排序与图片转 PDF 等文档操作",
      "文档全程在本地处理，不经过任何服务器中转",
      "适合合同、报表与内部资料等不宜外传的文件",
    ],
    icon: "document",
    accent: "rose",
    order: 3,
  },
];
