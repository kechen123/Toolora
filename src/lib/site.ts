/**
 * 站点级常量。
 *
 * 注意：生产域名尚未确定，因此这里不保存任何域名、canonical 或 sitemap 地址，
 * 避免生成无法访问的绝对链接。域名确定后再统一补充。
 */
export const siteConfig = {
  name: "Toolora",
  title: "Toolora - 好用的在线工具集合",
  description:
    "Toolora 是一个免费、简洁的在线工具集合：图片处理、开发工具、PDF 工具等常用功能，无需登录，尽可能在浏览器本地完成，数据不上传。",
  locale: "zh-CN",
  languageName: "简体中文",
} as const;
