/**
 * 注册测试用的模块解析钩子（供 `node --import` 使用）。
 */
import { register } from "node:module";

register("./test-alias-loader.mjs", import.meta.url);
