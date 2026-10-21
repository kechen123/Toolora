# Toolora V1 第一阶段设计说明（项目基础与高质量界面）

日期：2026-10-20
状态：已实现并通过构建验证

> 本文记录第一阶段的最终设计。实现过程中相对初稿的取舍，统一记录在文末「实现取舍记录」。

## 1. 阶段目标

交付 Toolora 的第一阶段成果：可静态构建的 Next.js 项目骨架 + 贴合设计参考图的高质量界面 + 最小可扩展的分类/工具注册表 + 三个工具的独立详情页框架。

**明确不在本阶段范围**：图片压缩、JSON 格式化、PDF 合并的真实处理能力；收藏；最近使用；完整站内搜索（拼音/模糊/独立结果页）；canonical / sitemap / robots 中的生产域名（域名未提供，不得编造）。

**发布状态**：本阶段产出的是**未发布的界面框架**。网站会等三个工具的真实处理能力完成并验证之后才上线，
因此页面不向访客展示任何开发状态标记（无「开发中」徽标、无开发提示条、正文不含阶段性表述），
注册表也不保留「功能状态」字段，避免留下上线时必须手动切换的隐含步骤。

## 2. 技术选型

| 项 | 选型 | 说明 |
|---|---|---|
| 框架 | Next.js 16.4.2（App Router） | 稳定版，`output: "export"` 纯静态导出 |
| 语言 | TypeScript 6.0.3，`strict` | 另开启 `noUncheckedIndexedAccess`、`noUnusedLocals`、`noUnusedParameters` |
| 样式 | Tailwind CSS v4.3.3（CSS-first） | `@theme` / `@theme inline` 定义设计令牌，`@utility` 定义自定义工具类 |
| 组件 | shadcn/ui（`radix-nova` preset，Radix 基础） | 按需引入，本阶段实际用到的才装 |
| 图标 | lucide-react 1.60.0 | 分类图标、工具图标、导航图标统一使用 |
| 主题 | next-themes | 浅色优先（`defaultTheme="system"`）+ 深色模式 |
| 字体 | Geist / Geist Mono（`geist` 包） | 通过 `next/font/local` 自托管，构建不依赖外部字体服务 |
| 图片压缩 | browser-image-compression 2.0.2（MIT） | Worker 中完成解码与重编码，支持按质量 / 目标体积压缩 |
| PDF 处理 | pdf-lib 1.17.1（MIT） | 解析 PDF 结构、读取页数、跨文档复制页面 |
| 包管理 | pnpm 11 | `packageManager` 字段锁定 |
| 动画 | 仅 CSS transition / Tailwind 自带 | 不额外引入 Motion，避免首页负担 |

**依赖纪律**：只安装实际使用的包。两个处理库都通过 `await import()` 按需加载——只有用户真正开始
压缩 / 合并时才会下载；已验证首页与所有工具页的脚本中都不包含这两个库（pdf-lib 约 419 KB、
browser-image-compression 约 51 KB，均在独立 chunk 中）。Monaco、Zustand 等仍未引入。

**worker 自托管**：`browser-image-compression` 默认从 jsdelivr CDN 加载它的 worker，会产生外部网络请求，
与「数据不上传、不发出外部请求」的承诺冲突，因此由 `scripts/sync-image-worker.mjs` 在构建前把 worker
复制到 `public/vendor/`（不入库），并通过 `libURL` 指向同源地址。

## 3. 目录结构

```text
src/
├── app/
│   ├── layout.tsx                 # 根布局：ThemeProvider + 侧栏 + 顶部导航 + 抽屉 + 快捷键
│   ├── page.tsx                   # 首页
│   ├── globals.css                # Tailwind v4 + shadcn 令牌 + 品牌令牌 + 自定义工具类
│   ├── icon.svg                   # 站点图标
│   ├── not-found.tsx
│   ├── about/page.tsx             # 关于（顶部导航第三项，避免死链）
│   ├── tools/page.tsx             # 全部工具
│   ├── tools/[slug]/page.tsx      # 工具详情（generateStaticParams）
│   ├── categories/page.tsx        # 分类索引
│   └── categories/[slug]/page.tsx # 分类页（generateStaticParams）
├── components/
│   ├── layout/                    # 侧栏 / 顶部导航 / 抽屉 / 主题切换 / 页脚 / 跳转链接
│   ├── home/                      # Hero / 搜索 / 热门工具 / 常用工具 / 分类 / 最近更新
│   ├── tools/                     # 工具卡片 / 工具页头部 / 工作区分发 / 使用说明 / FAQ / 相关工具
│   └── ui/                        # shadcn/ui 生成物
├── lib/                           # cn / 站点信息 / 图标表 / 分类配色 / 文件工具 / 搜索事件
├── registry/                      # ★ 工具与分类注册表（全站唯一数据源）
├── tools/                         # ★ 每个工具的独立模块
│   ├── image-compress/            #   workspace.tsx / compress.ts / guide.ts
│   ├── json-formatter/            #   workspace.tsx / json-parse.ts / json-tree.tsx / guide.ts
│   ├── pdf-merge/                 #   workspace.tsx / merge.ts / guide.ts
│   └── index.ts                   #   工具正文内容的按需加载索引
└── types/                         # 类型定义

scripts/
└── sync-image-worker.mjs          # 把压缩库 worker 同步到 public/vendor/（构建前自动执行）
```

## 4. 注册表设计（导航 / 首页 / 路由的唯一数据源）

`src/types/tool.ts`：

- `ToolCategory`：`slug` `name` `description`（可索引文案） `highlights[]`（可索引要点） `icon` `accent` `order`
- `ToolDefinition`：`id` `slug` `name` `shortDescription` `description` `categorySlug` `icon` `keywords[]` `popular` `featured` `updatedAt` `workspace` `seo{title,description}`
  （不设「功能状态」字段：站点在工具真正可用之前不发布，页面无需向访客展示开发状态，
  也不需要在上线时手动切换任何标记。）
- `ToolGuide`：`steps[]` `features[]` `faq[]`（工具页正文，与实现分离）

`src/registry/categories.ts` 导出分类数组；`src/registry/tools.ts` 导出工具数组与查询函数：
`getToolBySlug` `getCategoryBySlug` `getToolsByCategory` `getPopularTools` `getFeaturedTools` `getCategoriesWithTools` `getRelatedTools` `getRecentlyUpdatedTools`。

**注册表派生原则**：侧边栏分类项 = 至少含 1 个工具的分类（`getCategoriesWithTools`）；分类页卡片上的「N 个工具」为真实计数，不使用参考图中的示意数字。

**图标存键不存组件**：注册表的 `icon` 字段是 `IconKey` 字符串，图标组件集中在 `src/lib/icons.ts`。原因：注册表数据需要同时在服务端页面与客户端组件之间传递，组件引用无法序列化。

## 5. 页面与视觉规范

### 5.1 全站布局

- 桌面（≥1024px）：左侧固定侧栏 16rem + 右侧主区（顶部导航 + 内容）。
- 侧栏：品牌、搜索入口（⌘K）、导航（首页 / 全部工具 / 有工具的分类），底部为「本地处理 · 数据不上传」。
- 顶部导航：页签式（工具 / 分类 / 关于）+ 主题切换按钮；移动端左侧为抽屉按钮与品牌。
- 主区最大宽度 1400px，居中，水平内边距 1rem / 1.5rem / 2rem（响应式）。

### 5.2 设计令牌

- 背景：浅色 `oklch(0.985 0.002 247)`，深色 `oklch(0.17 0.015 260)`。
- 卡片：白底 + 1px 边框 + 12px 圆角 + 极柔和阴影（`surface-card` / `tool-card` 工具类）。
- 品牌主色：蓝紫 `oklch(0.585 0.203 277)`（≈ `#6366F1`），渐变 indigo → violet。
- 分类辅助色（柔和底色 + 同色图标）：图片=emerald、开发=indigo、PDF=rose。
- 字体层级：H1 30–42px/700、区块标题 18–20px/600、卡片标题 15px/600、正文 14px、辅助 13px。
- Hero 右侧用纯 CSS 渐变方块 + `animate-float` 表达，不使用图片与 3D 插画；`prefers-reduced-motion` 下停用动画。

### 5.3 首页区块

1. Hero：渐变卡片 + 徽标「高效 · 免费 · 无需登录 · 数据不上传」+ H1「好用的在线工具集合」+ 副标 + 大搜索框。
2. 搜索：客户端即时过滤，匹配注册表中的名称、关键词与简介；支持 ⌘K / Ctrl+K 从任意页面跳转并聚焦；匹配结果为可点击链接列表，含「无匹配」空态。
3. 热门工具：胶囊标签行 + 「更多 ›」→ /tools。
4. 常用工具：卡片网格（3 张真实工具卡）。
5. 按分类浏览：分类卡片（图标 + 名称 + 真实工具数 + 箭头）。
6. 最近更新：按 `updatedAt` 排序的工具卡（真实数据）。
7. 页脚：站点说明、本地处理与隐私说明、真实存在的页面链接。

不渲染「收藏」「最近使用」入口（后续阶段功能），避免死链与不可用控件。

### 5.4 分类页

面包屑（首页 / 分类名）→ H1（分类名）→ 分类介绍段落 → 3 条要点 → 工具卡片网格 → 「查看全部工具」入口。独立 `title` / `description`。

### 5.5 工具详情页统一框架

面包屑（首页 / 分类名 / 工具名）→ 工具头部（图标方块 + H1 + 描述 + 分类/更新时间/本地处理）→ **主操作区** → 使用说明（步骤）→ 功能特点 → 常见问题（Accordion）→ 相关工具（注册表派生）。

**主操作区处理原则（本阶段关键取舍）**：按设计图还原每个工具各自适用的布局结构，但所有控件为禁用/只读态。
不伪造任何处理结果、不模拟上传、不输出假的压缩率或校验结果；页面中也不向访客展示开发状态标记 ——
站点在三个工具真正可用之前不发布，届时控件转为可用即可，注册表与路由无需改动。

- 图片压缩：左侧「拖拽图片到此处」虚线框（支持点击选择与拖拽）+ 单图 / 批量处理 Tabs + 压缩方式（按质量 / 按目标大小）+ 输出格式（JPG / PNG / WebP）+ 高级设置（最大边长、保留 EXIF）；右侧为原图 / 结果分屏对比（可拖动分割线）、真实体积与压缩率、下载按钮。
- JSON 格式化：工具条（格式化 / 压缩 / 校验 / 清空 / 缩进 / 导入 / 复制 / 下载）+ 左侧带行号的可编辑输入区（带错误定位条）+ 右侧可折叠树形视图；解析失败时只显示错误，不显示可能过期的结构。
- PDF 合并：左侧「点击上传或拖拽 PDF 文件到此处」+ 输出文件名输入 + 「开始合并」按钮；右侧文件列表显示大小与页数，支持拖拽或按钮调整顺序，错误文件单独标记。

每个工具页独立 `title` / `description` / H1，正文以语义化 HTML 输出到静态 HTML。

## 6. 路由与静态导出

- `next.config.ts`：`output: "export"`、`images.unoptimized: true`、`trailingSlash: true`。
- `tools/[slug]` 与 `categories/[slug]` 使用 `generateStaticParams()` + `export const dynamicParams = false`。
- 无服务端 API、无 middleware、无需要常驻 Node 的能力。
- 不写 canonical / sitemap.xml / robots 中的域名；仅提供不含域名的 `public/robots.txt`（`User-agent: *` / `Allow: /`）。
- `metadataBase` 不设置，避免生成编造的绝对 URL。

## 7. 可访问性

跳转主内容的 skip link；导航 `aria-current="page"`；图标按钮 `aria-label`；抽屉由 Radix Dialog 提供焦点陷阱与 `aria-modal`；`:focus-visible` 可见焦点环；`prefers-reduced-motion` 降级；语义化标题层级（每个页面唯一 H1）。

## 8. 验证结果

| 命令 | 结果 |
| --- | --- |
| `pnpm typecheck` | 通过（`tsc --noEmit`，strict） |
| `pnpm lint` | 通过（ESLint flat config + eslint-config-next） |
| `pnpm test` | 通过（46 个用例：JSON 解析器 28、输出格式决策 7、PDF 校验 6、文件工具 5，node:test） |
| `pnpm build` | 通过，生成 13 个静态页面到 `out/` |

补充核对：全部 281 个站内链接可解析（13 个页面）；首页、分类页与三个工具页的 title / description / H1 / 正文
均存在于生成的静态 HTML 中；生成页面中面向访客的阶段 / 预告类提示为 0 处；首页与全部工具页的脚本中
都不包含图片压缩 / PDF 处理库（只在用户真正处理文件时按需加载）。

**浏览器实测（无头 Chrome + CDP 驱动真实交互，42 项断言全部通过）**：
图片点击选择与拖拽、单图 / 批量压缩、输出格式切换、下载内容可解码（1200×900 JPEG，13.5 KB < 原图 498 KB）、
非图片与损坏图片的报错与恢复；JSON 输入、格式化 / 压缩 / 校验、行列定位（第 1 行第 32 列）、树形视图、
缩进切换、复制、导入导出；PDF 多文件添加、页数显示、排序、合并（5 页）、下载文件可被 pdf-lib 解析、
损坏 / 加密 / 非 PDF 文件的分别报错。

**未能观测的部分**：本机 Chrome 会在收到全部字节后取消下载写入（普通 HTTP 下载与 data URL 同样被取消），
属于环境限制。因此下载验证改为拦截 `URL.createObjectURL` 与 `anchor.click`，直接校验文件名、MIME 与字节内容，
并用浏览器解码图片、用 pdf-lib 解析合并后的 PDF 来证明「下载结果确实可用」。

## 9. 自审修正记录

交付前对最终工作区做了一次独立自审（代码走查 + 静态产物核对 + 真实浏览器交互验证），并修复了以下问题：

1. **Hero 裁切搜索结果下拉框**：Hero 的 `overflow-hidden` 会裁掉绝对定位的下拉面板。改为把装饰光斑单独放进一层 `inset-0 overflow-hidden` 容器，section 本身不再裁切。
2. **移动端抽屉点击链接后不关闭**：Radix Dialog 不会因路由跳转自动关闭。`MobileNav` 改为受控 `open` 状态，并把 `onNavigate` 传给 `SidebarNav`。
3. **页脚分类导航硬编码且漏掉「PDF 工具」**：页脚改为从 `getCategoriesWithTools()` 派生，与侧边栏保持同源。
4. **Safari 点击搜索结果失效**：Safari 在 mousedown 时不聚焦按钮，容器的 `onBlur` 会先关闭面板。给结果项加 `onMouseDown={(e) => e.preventDefault()}`。
5. **「正在开发中」提示与注册表状态不一致**：改为只在 `tool.status === "in-development"` 时渲染。
   （该状态机制已在后续的「移除访客可见开发状态」修正中整体删除，见下节第 9-13 条。）
6. **`/tools` 页标题跳级（h1 → h3）**：`ToolCard` 增加 `headingLevel`，`/tools` 页使用 `h2`。
7. **抽屉宽度被变体类覆盖**：`data-[side=left]:w-3/4` 覆盖了 `w-[17rem]`，改用 `data-[side=left]:w-[17rem]`（实测宽度恢复为 272px）。
8. **搜索框无障碍语义不足**：补充 `role="combobox"`、`aria-expanded`、`aria-controls`、`aria-autocomplete`，结果区改为 `role="listbox"` + `role="option"`，并支持上下方向键在结果间移动。

### 移除访客可见的开发状态（第二次修正）

站点确定在三个工具真正可用后才上线，因此面向访客的页面不再展示开发状态：

9. **工具卡片「开发中」徽标** → 删除，卡片只保留图标、名称与描述。
10. **工具详情页开发提示条** → 删除 `DevelopmentNotice` 组件及其调用；操作区仍保持禁用状态。
11. **`ToolStatus` 与注册表 `status` 字段** → 整套状态机制删除（含 `src/types/tool.ts` 的类型、
    注册表中 3 条记录、`src/components/ui/alert.tsx` 这条专用实现），避免上线时需要手动切换标记。
12. **三个工具的使用说明与 FAQ** → 删除「现在可以使用了吗 / 还在开发中 / 尚未上线 / 正式版…」等阶段性问答，
    保留有实际价值的使用说明与隐私说明；对尚未验证的行为（文件大小上限、具体格式范围等）改为不含承诺的表述。
13. **其他面向访客的阶段性表述** → 关于页的「尚未实现的功能会明确标注为开发中」、404 页的「工具还没有上线」、
    侧边栏与首页的「打开即用」等表述一并调整；「日常开发中的琐碎问题」等含「开发中」字样的措辞改写以消除歧义。

修正后对 13 个生成页面做 30 个关键词的全文扫描，访客可见的阶段/预告类提示为 0 处。

### 实现三个工具的真实处理能力（第三次修正）

把「界面框架」升级为可用的工具，同时保持注册表驱动、静态导出与按需加载：

14. **工具模块归位**：工作区与处理逻辑从 `src/components/tools/workspaces/` 移到 `src/tools/<slug>/`，
    与指南放在同一目录；`src/components/tools/tool-workspace.tsx` 改为按 `workspace` 字段分发。
15. **JSON 解析器**：新增 `src/tools/json-formatter/json-parse.ts`——递归下降的严格解析器，
    输出结构化的错误信息（消息 / 字符位置 / 行 / 列），不依赖各浏览器 `JSON.parse` 的报错文案差异；
    配套 `json-parse.test.ts`（`node --test`）。
16. **图片压缩**：接入 `browser-image-compression`，支持点击选择与拖拽、单图 / 批量、按质量或按目标大小、
    输出格式切换、原图与结果分屏对比、真实体积与压缩率、单张与批量下载；Object URL 在移除 / 清空 / 卸载时释放。
17. **PDF 合并**：接入 `pdf-lib`，支持多文件添加（点击 / 拖拽）、大小与页数显示、拖拽或按钮排序、
    自定义输出文件名、合并下载；不传 `ignoreEncryption`，加密文件明确报错。
18. **移除无法可靠实现的控件**：PDF 的「页面设置」（合并所有页面 / 自定义页面范围）被删除，
    指南中对应的承诺一并改写，不保留可点击但无效的选项。
19. **按需加载处理库**：两个处理库都改为在真正处理文件时才 `await import()`，首页与所有工具页的脚本中
    都不包含它们（已在产物中逐 chunk 核对）。
20. **worker 自托管**：`scripts/sync-image-worker.mjs` 把压缩库的 worker 复制到 `public/vendor/`，
    避免默认从 CDN 加载造成外部网络请求；`public/vendor/` 不入库，构建时自动生成。
21. **错误信息**：底层库在 worker 传递中会丢失 Error 结构，因此压缩失败时主动判断文件能否被解码，
    给出「图片解码失败」这类可操作的提示；失败的文件仍保留在列表中可下载原图。

### 定向返工：解析正确性与资源生命周期（第四次修正）

22. **JSON 顶层前置空白**：解析器在读取顶层值之前没有跳过 JSON 允许的空白，
    `  {"a":1}` 与换行开头的数组会被误判为非法。已在顶层解析前跳过空白，行列定位仍按原文计算。
23. **JSON 数值不得被静默改写**：`1e400`（溢出成 Infinity）、`1e-400`（下溢成 0）、
    以及超出精确表示范围的大整数（如 9007199254740993）在浏览器里会被悄悄取整或变成 null。
    现在这类输入直接给出明确错误（消息 + 行列），不再输出「成功但数据已变」的结果；
    仍可精确表示的边界值（如 2^53、1e21）与普通小数保持原有行为。
    判定用 BigInt 做精确比较（`exactIntegerValue`），避免用 `Number.isSafeInteger` 误伤可精确表示的大数。
24. **JSON 原型相关键**：`result[key] = value` 会触发 `__proto__` 的原型 setter，导致该键被吞掉、
    甚至改写原型。改用 `Object.defineProperty` 写入自有可枚举属性，与浏览器原生 `JSON.parse` 行为一致。
25. **图片 Object URL 生命周期**：单图替换时原先遍历整个登记表释放 URL，会把刚创建的新图地址一起释放。
    改为按资源精确释放（`releaseUrls` + `collectObjectUrls`）：替换只释放旧图与旧结果，
    重新压缩会释放上一次的结果预览，移除 / 清空 / 卸载各自释放自己的地址。
26. **输出格式与实际字节必须一致**：原先「压缩结果不比原图小」时一律返回原文件，
    在用户选择转换格式（如 JPG → PNG）时会交付另一种格式。现在规则明确：
    重新编码后更小 → 交付重新编码结果；未变小但格式不同 → 仍按所选格式交付并提示体积变大；
    未变小且格式相同 → 交付原文件。决策抽成纯函数 `decideOutput` 并有单元测试。
27. **PDF 单文件上限未执行**：`merge.ts` 定义了 100 MB 上限但工作区没有检查。已抽出
    `validatePdfFile` 统一校验（空文件 / 单文件体积 / 明显非 PDF 类型），超限文件单独提示，其余文件不受影响。
28. **PDF 解析必须收敛到可见状态**：处理模块加载失败时，文件会永久停留在「正在解析」。
    现在模块加载失败会把这些文件统一标记为错误并给出提示；单个文件的解析异常也保证走 catch 分支。
29. **测试可运行**：新增 `scripts/test-alias-loader.mjs` 与 `scripts/register-test-alias.mjs`，
    让 `node --test` 能解析源码里的 `@/` 路径别名，测试覆盖扩展到 46 个用例。

## 10. 实现取舍记录

1. **字体**：环境无法访问 `fonts.googleapis.com`，`next/font/google` 会导致构建失败，改为 `geist` 包（`next/font/local` 自托管）。中文回落系统字体栈。
2. **TypeScript / ESLint 版本**：`latest`（TS 7.0.2 / ESLint 10.13.0）会突破 `eslint-config-next@16.4.2` 内部插件的 peer 范围（`typescript <6.1.0`、`eslint <=9`），改为 TS 6.0.3 + ESLint 9.39.5，`pnpm peers check` 无告警。
3. **图标键**：见 §4。
4. **搜索**：实现为注册表子串过滤（首页与 /tools 均可用），而非纯视觉占位；仍不含拼音、模糊匹配与独立结果页。
5. **侧边栏入口**：「常用工具」与「全部工具」在当前注册表下内容一致，合并为「全部工具」；「收藏」「最近使用」按阶段范围不实现，因此不出现在导航中。
6. **新增页面**：为避免顶部导航出现死链，补充了 `/tools`、`/categories`、`/about` 三个静态页面。
7. **分类页要点**：为满足「分类页有可索引的介绍内容」，`ToolCategory` 增加 `highlights[]`。
8. **生成组件本地化**：`sheet.tsx` 的 `Close`、`breadcrumb.tsx` 的 `More` 改为中文。
9. **`pnpm-workspace.yaml`**：pnpm 11 的 `minimumReleaseAge` 策略会拦截刚发布的 `lucide-react@1.60.0`，该文件记录例外项以保证 `pnpm install` 可复现。
10. **新增依赖的取舍**：现有依赖（浏览器原生 Canvas / File API）无法同时做到「目标体积搜索 + 不阻塞主线程」
    与「跨文档复制 PDF 页面」，因此引入 MIT 许可的 `browser-image-compression` 与 `pdf-lib`；
    两者都按需加载，不进入首页包体。
11. **批量下载的形式**：不引入 ZIP 库，批量结果按顺序逐个触发下载，并提示浏览器可能询问是否允许多文件下载。
12. **工具页仍共用一个动态路由**：`/tools/[slug]` 保留注册表驱动的 `generateStaticParams`，
    代价是三个工具的工作区 UI 代码会同时出现在三个工具页的脚本中（各约 40 KB，自有代码，非处理库）；
    拆成三个独立路由可以彻底隔离，但会改变「新增工具 = 注册表加一条」的扩展方式，故保留现状。

## 11. 已知风险

- 本阶段没有启动 Next.js 服务，也没有部署；视觉核对是对 `out/` 静态产物做无头浏览器渲染完成的，
  像素级还原度与深色模式的观感仍建议人工评审一次。
- 搜索仅为注册表子串过滤，不满足「中英文关键词 + 别名」的完整搜索需求（后续阶段）。
- 三个工具页目前仍是未发布的界面框架，站点在功能验证完成前不发布。工具页正文已写成工具本身的使用与
  隐私说明，不含阶段性表述；文件大小上限、格式范围等限制以界面提示为准，随实现变化需要同步修订。
- **下载落盘未能在本机观测**：本机 Chrome 会在收齐字节后取消下载写入（普通 HTTP 与 data URL 同样被取消），
  属环境限制。下载验证改为拦截 `createObjectURL` / `anchor.click`，校验文件名、MIME 与字节内容，
  并用浏览器解码图片、用 pdf-lib 解析合并后的 PDF，证明产物本身可用；在真实浏览器中仍建议再确认一次
  「点击下载后文件确实保存到本地」。
- **三个工具共用一个动态路由**：`/tools/[slug]` 让三个工具的工作区 UI 代码同时出现在各工具页，
  处理库本身已按需加载（见 §10 第 12 条）。
- **工具实现的边界**：图片压缩在输出为 PNG 时不会有体积收益（PNG 无损），此时会按所选格式如实输出并提示
  体积变大；加密 PDF 无法合并；JSON 严格遵循标准规范，并且无法精确表示的数值会直接报错——
  这些都在界面上如实提示，但真实使用中仍可能出现未覆盖的边界情况。
- **本轮返工未做浏览器验证**：按要求本轮没有启动任何服务，因此涉及交互的部分
  （单图连续替换后两侧预览是否同时可用、跨格式输出的实际下载字节、PDF 超限提示的展示位置）
  只做了代码与单元测试层面的验证，真实交互仍待人工或后续带服务的验证补上。
