/**
 * Node 测试用的模块解析钩子。
 *
 * 源码统一使用 `@/` 路径别名（由 tsconfig 的 paths + Next 的 bundler 解析），
 * 而 node:test 直接运行时并不认识这个别名，这里把它映射到 src/ 下。
 * node 的 ESM 解析要求显式扩展名，因此按 .ts / .tsx / index 的顺序补全。
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

// `@/` 指向 src/ 目录（与 tsconfig 的 paths 保持一致）。
const ROOT = pathToFileURL(`${process.cwd()}/src/`).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = new URL(specifier.slice(2), ROOT);
    const candidates = [
      `${base.href}.ts`,
      `${base.href}.tsx`,
      `${base.href}/index.ts`,
      `${base.href}/index.tsx`,
    ];
    const found = candidates.find((candidate) => existsSync(fileURLToPath(candidate)));
    return nextResolve(found ?? `${base.href}.ts`, context);
  }
  return nextResolve(specifier, context);
}
