/** 顶部导航项。 */
export const primaryNavItems = [
  { href: "/tools", label: "工具" },
  { href: "/categories", label: "分类" },
  { href: "/about", label: "关于" },
] as const;

/** 侧边栏中的固定入口。分类入口由注册表派生，见 `registry/tools.ts`。 */
export const sidebarStaticItems = [
  { href: "/", label: "首页" },
  { href: "/tools", label: "全部工具" },
] as const;
