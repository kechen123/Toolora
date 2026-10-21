# Toolora

免费、简洁的在线工具集合平台。无需注册登录，优先在浏览器本地完成处理，用户文件不上传服务器。

本仓库目前处于 **第一阶段（项目基础与界面）**：站点骨架、全站布局、首页、分类页与统一工具详情页框架已经完成，
**图片压缩、JSON 格式化、PDF 合并三个工具的真实浏览器本地处理能力已实现**（见下文「三个核心工具」）。

> **当前是未发布的界面框架。** 站点不会在三个工具完成验证之前上线，因此页面中不向访客展示任何开发状态标记。

## 技术栈

| 模块 | 方案 |
| --- | --- |
| 框架 | Next.js 16（App Router）+ React 19 |
| 语言 | TypeScript（`strict`，含 `noUncheckedIndexedAccess`） |
| 样式 | Tailwind CSS v4（CSS-first，`@theme` 定义设计令牌） |
| 组件 | shadcn/ui（new-york / Radix 基础） |
| 图标 | Lucide React |
| 主题 | next-themes（浅色优先，支持深色模式） |
| 图片压缩 | browser-image-compression 2.0.2（MIT） |
| PDF 处理 | pdf-lib 1.17.1（MIT） |
| 包管理 | pnpm |
| 构建模式 | Next.js Static Export（`output: "export"`） |

### 关于新增的两个依赖

现有依赖（浏览器原生 Canvas / File API）无法覆盖两个能力，因此引入两个 MIT 许可的成熟库：

- **browser-image-compression**：负责图片解码后按质量 / 目标体积重新编码，并在 Web Worker 中执行，
  避免大图压缩时阻塞主线程。原生 Canvas 方案无法同时做好「目标体积搜索」和「不卡界面」。
- **pdf-lib**：负责解析 PDF 结构、读取页数与跨文档复制页面。浏览器没有等价的原生能力。

包体影响（压缩后约 30 KB + 120 KB）：两个库都通过 `await import()` **按需加载**，
只有在用户真正开始压缩 / 合并时才会下载；首页与其它页面的脚本中不包含它们。

`browser-image-compression` 默认从 jsdelivr CDN 加载它的 worker，会产生外部网络请求，与「数据不上传、
不发出外部请求」的承诺冲突，因此由 `scripts/sync-image-worker.mjs` 把 worker 复制到 `public/vendor/`
（该目录不入库，构建时自动生成），并通过 `libURL` 指向同源地址。

像 Monaco Editor、Zustand 这类尚未使用的库仍然没有引入。

## 本地开发

```bash
pnpm install       # 安装依赖
pnpm dev           # 启动开发服务器，默认 http://localhost:3000
```

## 构建与检查

```bash
pnpm typecheck     # tsc --noEmit，严格类型检查
pnpm lint          # ESLint（eslint-config-next + typescript）
pnpm test          # 单元测试（node:test，运行 JSON 解析器用例）
pnpm build         # 静态构建，产物输出到 out/
```

`pnpm build` 结束后可以直接用任意静态服务器预览 `out/` 目录，例如：

```bash
npx serve out
```

项目使用 `output: "export"`，**不支持** `next start`（没有需要常驻运行的 Node.js 服务）。

## 目录结构

```text
src/
├── app/                       # 路由
│   ├── layout.tsx             # 根布局：主题、侧栏、顶部导航、移动端抽屉
│   ├── page.tsx               # 首页
│   ├── about/page.tsx         # 关于
│   ├── tools/page.tsx         # 全部工具
│   ├── tools/[slug]/page.tsx  # 工具详情页（generateStaticParams）
│   ├── categories/page.tsx    # 分类索引
│   ├── categories/[slug]/page.tsx  # 分类页（generateStaticParams）
│   └── globals.css            # Tailwind v4 + shadcn 令牌 + 品牌令牌
├── components/
│   ├── layout/                # 全站布局：侧栏、顶部导航、抽屉、主题切换、页脚
│   ├── home/                  # 首页区块：Hero、搜索、热门工具、常用工具、分类、最近更新
│   ├── tools/                 # 工具卡片、工具页头部、工作区分发、使用说明、FAQ、相关工具
│   └── ui/                    # shadcn/ui 组件
├── lib/                       # cn、站点信息、图标表、分类配色、文件工具、搜索事件
├── registry/                  # ★ 工具与分类注册表（全站唯一数据源）
├── tools/                     # ★ 每个工具的独立模块
│   ├── image-compress/        #   workspace.tsx（操作区）+ compress.ts（压缩逻辑）+ guide.ts（正文）
│   ├── json-formatter/        #   workspace.tsx + json-parse.ts + json-tree.tsx + guide.ts
│   ├── pdf-merge/             #   workspace.tsx + merge.ts + guide.ts
│   └── index.ts               # 工具正文内容的按需加载索引
└── types/                     # 类型定义

scripts/
└── sync-image-worker.mjs      # 把压缩库的 worker 同步到 public/vendor/（构建前自动执行）
```

## 三个核心工具

全部在浏览器本地完成，不上传任何文件，也不发起外部网络请求。

| 工具 | 能力 |
| --- | --- |
| 图片压缩 | 点击 / 拖拽添加 JPG、PNG、WebP；单图与批量模式；按质量或按目标大小压缩；可选输出格式（JPG / PNG / WebP）；原图与结果分屏对比、真实体积与压缩率；单张下载与批量逐个下载 |
| JSON 格式化 | 可编辑输入；格式化、压缩、语法校验、缩进切换（2 空格 / 4 空格 / Tab）；错误定位到具体行列并可跳转；可折叠树形视图；复制；导入 / 导出 `.json` |
| PDF 合并 | 点击 / 拖拽添加多个 PDF；显示大小与页数；拖拽或按钮调整顺序；自定义输出文件名；合并后下载单个 PDF |

## 工具注册机制

全站的导航、首页卡片、分类页、搜索与静态路由都由注册表驱动：

- `src/registry/categories.ts` —— 分类定义（名称、介绍、要点、图标键、配色、排序）。
- `src/registry/tools.ts` —— 工具定义（id、slug、名称、描述、分类、图标键、关键词、
  热门/常用标记、更新时间、SEO 元数据、工作区类型），并导出查询函数
  （`getToolBySlug`、`getCategoryBySlug`、`getToolsByCategory`、`getPopularTools`、
  `getFeaturedTools`、`getCategoriesWithTools`、`getRelatedTools`、`getRecentlyUpdatedTools`）。

注册表只保存**图标键**而不是组件引用，图标组件统一放在 `src/lib/icons.ts`，
这样工具数据可以在服务端与客户端之间安全序列化。

### 新增一个工具

1. 在 `src/tools/<slug>/guide.ts` 中编写该工具的使用说明、功能特点与常见问题。
2. 在 `src/tools/index.ts` 中登记该 slug 的正文内容（动态导入，保持按需加载）。
3. 在 `src/registry/tools.ts` 中增加一条 `ToolDefinition`。
4. 如果是新分类，在 `src/registry/categories.ts` 中增加分类，并在
   `src/lib/category-accent.ts` 中登记配色。
5. 在 `src/tools/<slug>/workspace.tsx` 中实现操作区，若依赖较重的第三方库，
   请在**使用处**用 `await import()` 动态导入，保证只有该工具页面会加载它。
6. 在 `src/components/tools/tool-workspace.tsx` 中接入分发（`workspace` 字段对应的分支）。

导航、首页卡片与分类计数都会自动更新，不需要改动组件；
`/tools/[slug]` 的 `generateStaticParams` 会自动包含新工具。

## 静态导出与部署

- `next.config.ts` 中 `output: "export"`，`trailingSlash: true`（每个路由输出为目录 + `index.html`），
  `images.unoptimized: true`。
- 动态路由使用 `generateStaticParams()` 并设置 `dynamicParams = false`，
  未在注册表中登记的路径直接 404。
- 构建产物位于 `out/`，可以直接部署到 Cloudflare Pages、GitHub Pages 或任意静态托管。
- 站点不依赖任何需要常驻运行的 Node.js 服务，也没有数据库、后端 API 或登录系统。

## 环境限制与注意事项

- **纯静态**：没有服务端 API、没有数据库、没有用户系统。任何需要登录、付费或服务端计算的能力都不在当前架构内。
- **生产域名尚未确定**：因此 `metadata` 中没有配置 `metadataBase`，也没有生成 canonical URL、
  `sitemap.xml` 或带域名的 robots 规则。`public/robots.txt` 目前只有 `User-agent: *` 与 `Allow: /`，
  域名确定后需要补充 `Sitemap` 行。
- **浏览器本地处理的边界**：文件处理依赖浏览器内存，超大文件可能失败；依赖跨域请求的能力
  （例如在线 API 调试）会受到浏览器 CORS 限制。相关限制会在对应工具页中明确说明。
- **工具自身的限制**（均会在界面上提示）：
  - 图片压缩：单文件 ≤ 20 MB，单次 ≤ 30 张、合计 ≤ 100 MB；PNG 输出为无损格式，体积通常不会变大
    （此时会按所选格式如实输出并提示体积变化，不会悄悄换成其它格式）。
  - JSON 格式化：内容超过 2 MB 时不再自动解析，需要手动点「校验」；最多支持 200 层嵌套；
    严格遵循 JSON 规范，不接受注释、尾随逗号、JSON5 / JSONC；无法被精确表示的数值
    （溢出、下溢为 0、超出精确范围的大整数）会直接报错，而不是被悄悄取整或变成 null。
  - PDF 合并：单次 ≤ 30 个文件、单个 ≤ 100 MB、合计 ≤ 300 MB；加密的 PDF 会被明确拒绝，
    不会用忽略加密的方式处理。
- **搜索范围**：站内搜索目前只检索注册表中已存在的工具（名称、关键词、简介的子串匹配），
  不包含拼音、模糊匹配或独立结果页，完整搜索能力在后续阶段补充。

## 当前阶段的范围

已完成：

- Next.js + TypeScript + Tailwind + shadcn/ui 的项目骨架与严格类型检查
- 桌面侧栏、顶部导航、移动端抽屉导航、浅色主题与深色模式
- 首页、分类页、全部工具页与统一工具详情页框架
- 三个工具的真实浏览器本地处理能力（图片压缩 / JSON 格式化 / PDF 合并）
- 注册表驱动的导航、分类计数与站内搜索

后续阶段：

- 收藏与最近使用（保存在浏览器本地）
- 完整站内搜索
- sitemap、canonical 等需要生产域名的 SEO 配置
- 更多工具（按需求文档的规划逐步补充）
