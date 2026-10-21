import assert from "node:assert/strict";
import { test } from "node:test";

import { decideOutput, type OutputDecisionInput } from "./compress.ts";

function makeBlob(size: number, type = "image/jpeg"): Blob {
  return new Blob([new Uint8Array(size)], { type });
}

function makeInput(overrides: Partial<OutputDecisionInput> = {}): OutputDecisionInput {
  return {
    originalBlob: makeBlob(1000, "image/jpeg"),
    originalSize: 1000,
    originalType: "image/jpeg",
    originalFilename: "photo.jpg",
    compressedBlob: makeBlob(400, "image/jpeg"),
    compressedSize: 400,
    requestedType: "image/jpeg",
    ...overrides,
  };
}

test("重新编码后更小：交付重新编码的结果", () => {
  const result = decideOutput(makeInput());
  assert.equal(result.size, 400);
  assert.equal(result.type, "image/jpeg");
  assert.equal(result.filename, "photo.jpg");
  assert.equal(result.keptOriginal, false);
  assert.equal(result.grew, false);
});

test("格式相同但没有变小：交付原文件并标记", () => {
  const original = makeBlob(1000, "image/jpeg");
  const result = decideOutput(
    makeInput({
      originalBlob: original,
      compressedBlob: makeBlob(5000, "image/jpeg"),
      compressedSize: 5000,
    }),
  );
  assert.equal(result.blob, original);
  assert.equal(result.size, 1000);
  assert.equal(result.type, "image/jpeg");
  assert.equal(result.filename, "photo.jpg");
  assert.equal(result.keptOriginal, true);
  assert.equal(result.grew, false);
});

test("转换格式后体积变大：仍交付所选格式并标记体积变大", () => {
  const result = decideOutput(
    makeInput({
      originalType: "image/jpeg",
      originalFilename: "photo.jpg",
      compressedBlob: makeBlob(9000, "image/png"),
      compressedSize: 9000,
      requestedType: "image/png",
    }),
  );
  // 交付的必须是 PNG，而不是悄悄退回原图。
  assert.equal(result.type, "image/png");
  assert.equal(result.size, 9000);
  assert.equal(result.filename, "photo.png");
  assert.equal(result.keptOriginal, false);
  assert.equal(result.grew, true);
});

test("PNG 输出：格式与扩展名一致", () => {
  const result = decideOutput(
    makeInput({
      originalType: "image/jpeg",
      originalFilename: "photo.jpg",
      compressedBlob: makeBlob(9000, "image/png"),
      compressedSize: 9000,
      requestedType: "image/png",
    }),
  );
  assert.equal(result.type, "image/png");
  assert.equal(result.filename, "photo.png");
  assert.ok(result.filename.endsWith(".png"));
});

test("WebP 输出：格式与扩展名一致", () => {
  const result = decideOutput(
    makeInput({
      originalType: "image/png",
      originalFilename: "photo.png",
      compressedBlob: makeBlob(300, "image/webp"),
      compressedSize: 300,
      requestedType: "image/webp",
    }),
  );
  assert.equal(result.type, "image/webp");
  assert.equal(result.filename, "photo.webp");
  assert.equal(result.grew, false);
});

test("交付文件的字节、MIME 与扩展名三者一致", () => {
  for (const requestedType of ["image/jpeg", "image/png", "image/webp"] as const) {
    const result = decideOutput(
      makeInput({
        originalType: "image/jpeg",
        originalFilename: "photo.jpg",
        compressedBlob: makeBlob(5000, requestedType),
        compressedSize: 5000,
        requestedType,
      }),
    );
    const expectedExtension =
      requestedType === "image/jpeg" ? "jpg" : requestedType === "image/png" ? "png" : "webp";
    assert.equal(result.type, requestedType);
    assert.equal(result.blob.type, requestedType);
    assert.ok(result.filename.endsWith(`.${expectedExtension}`), result.filename);

    if (requestedType === "image/jpeg") {
      // 与原图同格式且重新编码没有变小：交付原文件，格式仍然一致。
      assert.equal(result.keptOriginal, true);
      assert.equal(result.grew, false);
      assert.equal(result.size, 1000);
    } else {
      // 跨格式：必须交付所选格式，即使体积变大。
      assert.equal(result.keptOriginal, false);
      assert.equal(result.grew, true);
      assert.equal(result.size, 5000);
    }
  }
});

test("原文件没有扩展名时也能生成正确的文件名", () => {
  const result = decideOutput(
    makeInput({
      originalFilename: "photo",
      originalType: "image/jpeg",
      compressedSize: 200,
    }),
  );
  assert.equal(result.filename, "photo.jpg");
});
