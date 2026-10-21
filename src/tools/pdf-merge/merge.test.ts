import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_FILE_SIZE, hasPdfHeader, validatePdfFile } from "./merge.ts";

function makeFile(name: string, size: number, type = "application/pdf"): File {
  return new File([new Uint8Array(size)], name, { type });
}

test("空文件被拒绝", () => {
  const problem = validatePdfFile(makeFile("empty.pdf", 0));
  assert.ok(problem);
  assert.match(problem, /文件为空/);
});

test("超过单文件上限被拒绝", () => {
  const problem = validatePdfFile(makeFile("big.pdf", MAX_FILE_SIZE + 1));
  assert.ok(problem);
  assert.match(problem, /单个文件不能超过/);
  // 刚好等于上限是允许的。
  assert.equal(validatePdfFile(makeFile("limit.pdf", MAX_FILE_SIZE)), null);
});

test("非 PDF 类型被拒绝", () => {
  const problem = validatePdfFile(makeFile("note.txt", 10, "text/plain"));
  assert.ok(problem);
  assert.match(problem, /不支持的文件类型/);
});

test("拖拽场景下没有 MIME 类型时不做类型拦截", () => {
  assert.equal(validatePdfFile(makeFile("a.pdf", 10, "")), null);
});

test("正常 PDF 通过校验", () => {
  assert.equal(validatePdfFile(makeFile("a.pdf", 1024)), null);
});

test("识别 PDF 文件头", () => {
  const header = new TextEncoder().encode("%PDF-1.7");
  assert.equal(hasPdfHeader(header), true);
  assert.equal(hasPdfHeader(new TextEncoder().encode("not a pdf")), false);
  assert.equal(hasPdfHeader(new Uint8Array(0)), false);
  // 文件头前有少量空白时也应识别（部分生成器会这样输出）。
  const padded = new TextEncoder().encode("\n\n%PDF-1.4");
  assert.equal(hasPdfHeader(padded), true);
});
