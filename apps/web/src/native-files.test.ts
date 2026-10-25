import test from "node:test";
import assert from "node:assert/strict";

test("原生导出分块后字节一致，路径安全，取消和失败不报成功", async () => {
  const previousReader = Object.getOwnPropertyDescriptor(globalThis, "FileReader");
  const previousCapacitor = Object.getOwnPropertyDescriptor(globalThis, "Capacitor");
  const previousBridge = Object.getOwnPropertyDescriptor(globalThis, "androidBridge");
  const files = new Map<string, Buffer>();
  let failure = "";
  let shared = 0;
  let lastPath = "";
  const nativePromise = async (plugin: string, method: string, options: any) => {
    if (plugin === "Share") {
      shared++;
      if (failure === "cancel") throw new Error("Share canceled");
      assert.equal(options.files[0], `file:///cache/${lastPath}`);
      return { activityType: "test.receiver" };
    }
    const path: string = options.path;
    if (method === "writeFile") {
      lastPath = path;
      files.set(path, Buffer.alloc(0));
      return { uri: `file:///cache/${path}` };
    }
    if (method === "deleteFile") return void files.delete(path);
    if (failure === "write") throw new Error("storage full");
    const chunk = Buffer.from(options.data, "base64");
    assert.ok(chunk.length <= 1024 * 1024);
    files.set(path, Buffer.concat([files.get(path)!, chunk]));
    return {};
  };
  Object.defineProperty(globalThis, "androidBridge", {
    configurable: true,
    value: {},
  });
  Object.defineProperty(globalThis, "Capacitor", {
    configurable: true,
    writable: true,
    value: {
      nativePromise,
      PluginHeaders: [
        {
          name: "Filesystem",
          methods: ["writeFile", "appendFile", "deleteFile"].map((name) => ({
            name,
            rtype: "promise",
          })),
        },
        { name: "Share", methods: [{ name: "share", rtype: "promise" }] },
      ],
    },
  });
  Object.defineProperty(globalThis, "FileReader", {
    configurable: true,
    value: class {
      result: string | null = null;
      onload?: () => void;
      onerror?: () => void;
      async readAsDataURL(blob: Blob) {
        if (failure === "read") return this.onerror?.();
        this.result = `data:application/octet-stream;base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
        this.onload?.();
      }
    },
  });
  try {
    const { shareNativeFile } = await import("./native-files");
    const bytes = new Uint8Array(2 * 1024 * 1024 + 7);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251;
    assert.equal(await shareNativeFile(new Blob([bytes]), "客户报价.xlsx"), true);
    assert.deepEqual(files.get(lastPath), Buffer.from(bytes));

    assert.equal(await shareNativeFile(new Blob([]), "../" + "😀".repeat(100) + ".xlsx"), true);
    assert.match(lastPath, /^exports\/[^/]+\/[^/]+\.xlsx$/);
    assert.ok(Buffer.byteLength(lastPath.split("/").at(-1)!) < 255);
    assert.equal(files.get(lastPath)?.length, 0);
    await shareNativeFile(new Blob([]), "..");
    assert.equal(lastPath.split("/").at(-1), "file");

    failure = "cancel";
    assert.equal(await shareNativeFile(new Blob([bytes]), "cancel.xlsx"), false);
    assert.equal(files.has(lastPath), false);
    const sharedBeforeFailure = shared;
    for (const mode of ["write", "read"]) {
      failure = mode;
      await assert.rejects(shareNativeFile(new Blob([bytes]), "failed.xlsx"));
      assert.equal(files.has(lastPath), false);
      assert.equal(shared, sharedBeforeFailure);
    }
  } finally {
    if (previousReader) Object.defineProperty(globalThis, "FileReader", previousReader);
    else Reflect.deleteProperty(globalThis, "FileReader");
    if (previousCapacitor) Object.defineProperty(globalThis, "Capacitor", previousCapacitor);
    else Reflect.deleteProperty(globalThis, "Capacitor");
    if (previousBridge) Object.defineProperty(globalThis, "androidBridge", previousBridge);
    else Reflect.deleteProperty(globalThis, "androidBridge");
  }
});
