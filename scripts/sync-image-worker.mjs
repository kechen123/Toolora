/**
 * 把 browser-image-compression 的 worker 脚本同步到 public/vendor/。
 *
 * 该库默认从 jsdelivr CDN 加载 worker，会产生外部网络请求；
 * 本站承诺所有处理都在本地完成、不发出任何外部请求，
 * 因此把 worker 自托管到站点同源路径，并通过 `libURL` 指向它。
 *
 * 脚本在 dev / build 前自动执行，保证与 node_modules 中的版本一致。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageDir = path.join(root, "node_modules/browser-image-compression");
const source = path.join(packageDir, "dist/browser-image-compression.js");
const license = path.join(packageDir, "LICENSE");
const targetDir = path.join(root, "public/vendor");
const target = path.join(targetDir, "browser-image-compression.js");

if (!fs.existsSync(source)) {
  console.error(
    "[sync-image-worker] 找不到 browser-image-compression 的 worker 脚本，请先执行 pnpm install。",
  );
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
fs.copyFileSync(license, path.join(targetDir, "browser-image-compression.LICENSE.txt"));

console.log("[sync-image-worker] 已同步 worker 到 public/vendor/");
