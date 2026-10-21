import assert from "node:assert/strict";
import { test } from "node:test";

import { collectObjectUrls, formatBytes, replaceExtension, uniqueFilename } from "./file-utils.ts";

test("collectObjectUrls 只挑出有效的地址", () => {
  assert.deepEqual(collectObjectUrls(["blob:a", null, undefined, "", "blob:b"]), ["blob:a", "blob:b"]);
  assert.deepEqual(collectObjectUrls([]), []);
  assert.deepEqual(collectObjectUrls([null, undefined]), []);
});

test("collectObjectUrls 不会把新加入的地址一并挑出", () => {
  // 单图替换场景：释放旧图与旧结果，新图地址必须保留。
  const old = ["blob:old-original", "blob:old-result"];
  const fresh = "blob:new-original";
  const released = collectObjectUrls(old);
  assert.equal(released.includes(fresh), false);
  assert.deepEqual(released, old);
});

test("字节格式化", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(1024), "1.00 KB");
  assert.equal(formatBytes(1536), "1.50 KB");
  assert.equal(formatBytes(1024 * 1024), "1.00 MB");
});

test("扩展名替换", () => {
  assert.equal(replaceExtension("photo.png", "webp"), "photo.webp");
  assert.equal(replaceExtension("photo", "jpg"), "photo.jpg");
  assert.equal(replaceExtension("a.b.png", "jpg"), "a.b.jpg");
});

test("批量下载的文件名不重复", () => {
  const taken = new Set<string>();
  assert.equal(uniqueFilename("photo.jpg", taken), "photo.jpg");
  assert.equal(uniqueFilename("photo.jpg", taken), "photo-2.jpg");
  assert.equal(uniqueFilename("photo.jpg", taken), "photo-3.jpg");
});
