import assert from "node:assert/strict";
import { test } from "node:test";

import {
  countLines,
  exactIntegerValue,
  formatJsonValue,
  minifyJsonValue,
  parseJsonStrict,
} from "./json-parse.ts";

function expectError(text: string): { message: string; position: number; line: number; column: number } {
  const result = parseJsonStrict(text);
  assert.equal(result.ok, false, `期望解析失败：${text}`);
  if (result.ok) {
    throw new Error("unreachable");
  }
  return result.error;
}

test("解析对象并保留键顺序", () => {
  const result = parseJsonStrict('{"b":1,"a":2}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(Object.keys(result.value as object), ["b", "a"]);
});

test("解析顶层数组与顶层基础值", () => {
  for (const text of ["[1,2,3]", '"文本"', "42", "true", "false", "null"]) {
    const result = parseJsonStrict(text);
    assert.equal(result.ok, true, `应当解析成功：${text}`);
  }
});

test("解析嵌套结构", () => {
  const result = parseJsonStrict('{"a":{"b":[1,{"c":null}]}}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, { a: { b: [1, { c: null }] } });
});

test("保留中文字符且不被转义", () => {
  const result = parseJsonStrict('{"名称":"图片压缩","说明":"中文内容"}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, { 名称: "图片压缩", 说明: "中文内容" });
  assert.equal(formatJsonValue(result.value, 2), '{\n  "名称": "图片压缩",\n  "说明": "中文内容"\n}');
});

test("解析转义字符与 Unicode 转义", () => {
  const result = parseJsonStrict('{"a":"line\\nbreak \\u4e2d\\u6587 \\"q\\" \\\\ \\/"}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal((result.value as { a: string }).a, 'line\nbreak 中文 "q" \\ /');
});

test("解析数字格式", () => {
  const result = parseJsonStrict("[0,-0.5,1e3,2.5E-2,12345]");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, [0, -0.5, 1000, 0.025, 12345]);
});

test("空输入返回明确错误", () => {
  const error = expectError("   \n  ");
  assert.match(error.message, /内容为空/);
  assert.equal(error.line, 1);
  assert.equal(error.column, 1);
});

test("拒绝尾随逗号", () => {
  assert.match(expectError('{"a":1,}').message, /多余的逗号/);
  assert.match(expectError("[1,2,]").message, /多余的逗号/);
});

test("拒绝缺少冒号并给出位置", () => {
  const error = expectError('{"a" 1}');
  assert.match(error.message, /冒号/);
  assert.equal(error.position, 5);
  assert.equal(error.line, 1);
  assert.equal(error.column, 6);
});

test("拒绝未闭合的字符串与容器", () => {
  assert.match(expectError('{"a":"abc}').message, /字符串没有闭合/);
  assert.match(expectError('{"a":1').message, /没有闭合/);
  assert.match(expectError("[1,2").message, /没有闭合/);
});

test("拒绝非标准写法", () => {
  assert.match(expectError("{'a':1}").message, /双引号/);
  assert.match(expectError('{"a":1} // 注释').message, /多余字符|无法识别/);
  assert.match(expectError("NaN").message, /无法识别/);
  assert.match(expectError("Infinity").message, /无法识别/);
  assert.match(expectError("undefined").message, /无法识别/);
  assert.match(expectError("01").message, /多余字符/);
});

test("拒绝无效转义", () => {
  assert.match(expectError('{"a":"\\q"}').message, /转义字符/);
  assert.match(expectError('{"a":"\\u12"}').message, /Unicode/);
});

test("拒绝字符串中的原始控制字符", () => {
  assert.match(expectError('{"a":"line\nbreak"}').message, /控制字符/);
});

test("错误行列定位到正确的行与列", () => {
  const error = expectError('{\n  "a": 1,\n  "b" 2\n}');
  assert.equal(error.line, 3);
  // 第 3 行是 `  "b" 2`，出错字符 `2` 位于第 7 列。
  assert.equal(error.column, 7);
  assert.equal(error.position, 18);
});

test("拒绝超深嵌套", () => {
  const deep = `${"[".repeat(300)}${"]".repeat(300)}`;
  assert.match(expectError(deep).message, /嵌套层级过深/);
});

test("重复键以最后一个为准", () => {
  const result = parseJsonStrict('{"a":1,"a":2}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, { a: 2 });
});

test("格式化与压缩输出正确", () => {
  const result = parseJsonStrict('{"a":[1,2],"b":"x"}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(formatJsonValue(result.value, 2), '{\n  "a": [\n    1,\n    2\n  ],\n  "b": "x"\n}');
  assert.equal(formatJsonValue(result.value, 4).includes("\n    \"a\""), true);
  assert.equal(formatJsonValue(result.value, "\t").includes("\n\t\"a\""), true);
  assert.equal(minifyJsonValue(result.value), '{"a":[1,2],"b":"x"}');
});

test("统计行数", () => {
  assert.equal(countLines(""), 1);
  assert.equal(countLines("a"), 1);
  assert.equal(countLines("a\nb"), 2);
  assert.equal(countLines("a\nb\n"), 3);
});

// ---------- 顶层前置空白 ----------

test("接受顶层值之前的空白字符", () => {
  for (const text of ['  {"a":1}', "\n[1,2]", "\t{\"a\": 1}\n", "\r\n{\"a\":1}\r\n", "   42  "]) {
    const result = parseJsonStrict(text);
    assert.equal(result.ok, true, `应当解析成功：${JSON.stringify(text)}`);
  }
});

test("前置空白不影响行列定位", () => {
  const error = expectError('  \n  {"a" 1}');
  // 第 2 行是 `  {"a" 1}`，出错字符 `1` 位于第 8 列。
  assert.equal(error.line, 2);
  assert.equal(error.column, 8);
  assert.equal(error.position, 10);
});

// ---------- 原型相关键 ----------

test("__proto__ 键被完整保留且不改变原型", () => {
  const result = parseJsonStrict('{"__proto__":{"x":1},"a":2}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const value = result.value as Record<string, unknown>;

  // 键必须作为自有可枚举属性存在，而不是被原型 setter 吞掉。
  assert.equal(Object.keys(value).includes("__proto__"), true);
  assert.equal(Object.prototype.hasOwnProperty.call(value, "__proto__"), true);
  assert.deepEqual(value["__proto__"], { x: 1 });
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  // 与浏览器原生 JSON 行为一致：序列化结果保留该键。
  assert.equal(JSON.stringify(value), '{"__proto__":{"x":1},"a":2}');
  assert.equal(JSON.stringify(value), JSON.stringify(JSON.parse('{"__proto__":{"x":1},"a":2}')));
});

test("constructor / prototype 等键按普通键处理", () => {
  const result = parseJsonStrict('{"constructor":1,"prototype":2,"toString":3}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const value = result.value as Record<string, unknown>;
  assert.equal(value.constructor, 1);
  assert.equal(value.prototype, 2);
  assert.equal(value.toString, 3);
  assert.equal(JSON.stringify(value), '{"constructor":1,"prototype":2,"toString":3}');
});

// ---------- 数值不得被静默改写 ----------

test("溢出的数值给出明确错误而不是变成 null", () => {
  const error = expectError('{"x":1e400}');
  assert.match(error.message, /超出可表示范围/);
  // 原生 JSON.parse 会成功，但序列化后变成 null，属于静默改写。
  assert.equal(JSON.parse('{"x":1e400}').x, Infinity);
  assert.equal(JSON.stringify(JSON.parse('{"x":1e400}')), '{"x":null}');
});

test("下溢为 0 的数值给出明确错误", () => {
  const error = expectError('{"x":1e-400}');
  assert.match(error.message, /太小/);
  assert.equal(JSON.parse('{"x":1e-400}').x, 0);
});

test("超出安全整数范围的大整数给出明确错误", () => {
  const error = expectError('{"x":9007199254740993}');
  assert.match(error.message, /超出可精确表示的范围/);
  // 原生会静默取整。
  assert.equal(JSON.parse('{"x":9007199254740993}').x, 9007199254740992);
});

test("仍然可以精确表示的边界数值正常解析", () => {
  const result = parseJsonStrict('{"x":9007199254740992,"y":1e21,"z":-9007199254740991}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, { x: 9007199254740992, y: 1e21, z: -9007199254740991 });
  assert.equal(JSON.stringify(result.value), JSON.stringify(JSON.parse('{"x":9007199254740992,"y":1e21,"z":-9007199254740991}')));
});

test("普通小数仍按原生行为处理", () => {
  const result = parseJsonStrict('{"x":0.1,"y":1.50,"z":1e3}');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(JSON.stringify(result.value), JSON.stringify(JSON.parse('{"x":0.1,"y":1.50,"z":1e3}')));
});

test("精确整数值辅助函数", () => {
  assert.equal(exactIntegerValue("42"), 42n);
  assert.equal(exactIntegerValue("-42"), -42n);
  assert.equal(exactIntegerValue("1e3"), 1000n);
  assert.equal(exactIntegerValue("1.5e3"), 1500n);
  assert.equal(exactIntegerValue("1e-3"), null);
  assert.equal(exactIntegerValue("0.5"), null);
  assert.equal(exactIntegerValue("1e21"), 10n ** 21n);
});
