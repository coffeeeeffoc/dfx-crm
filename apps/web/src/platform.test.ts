import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolveConfig } from "vite";
import capacitor from "../capacitor.config";

test("Pages 子路径保留 PWA，原生构建固定根路径并隔离网页缓存", async () => {
  const previous = process.env.VITE_BASE_PATH;
  process.env.VITE_BASE_PATH = "/dfx-crm/";
  try {
    const options = {
      root: fileURLToPath(new URL("..", import.meta.url)),
      configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
      logLevel: "silent" as const,
    };
    const web = await resolveConfig({ ...options, mode: "production" }, "build");
    assert.equal(web.base, "/dfx-crm/");
    assert.equal(web.build.outDir, "dist");
    const webPwa = web.plugins.find((plugin) => plugin.name === "vite-plugin-pwa");
    assert.ok(webPwa?.api);
    assert.equal(webPwa.api.disabled, false);
    assert.equal(webPwa.api.webManifestData().href, "/dfx-crm/manifest.webmanifest");

    const native = await resolveConfig({ ...options, mode: "native" }, "build");
    assert.equal(native.base, "/");
    assert.equal(native.build.outDir, capacitor.webDir);
    const nativePwa = native.plugins.find((plugin) => plugin.name === "vite-plugin-pwa");
    assert.ok(nativePwa?.api);
    assert.equal(nativePwa.api.disabled, true);
    assert.equal(nativePwa.api.webManifestData(), undefined);
  } finally {
    if (previous === undefined) delete process.env.VITE_BASE_PATH;
    else process.env.VITE_BASE_PATH = previous;
  }
});

test("安装图标是满足声明尺寸的 PNG", () => {
  for (const [name, size] of [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ] as const) {
    const image = readFileSync(new URL(`../public/icons/${name}`, import.meta.url));
    assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(image.readUInt32BE(16), size);
    assert.equal(image.readUInt32BE(20), size);
  }
});
