import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { uid } from "@dfx-crm/core/domain";

function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string")
        return reject(new Error("文件读取失败"));
      resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.onabort = () => reject(new Error("文件读取已中断"));
    reader.readAsDataURL(blob);
  });
}

export async function shareNativeFile(blob: Blob, name: string): Promise<boolean> {
  const clean = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");
  const extension = /\.[^.]{1,10}$/.exec(clean)?.[0] || "";
  const stem = extension ? clean.slice(0, -extension.length) : clean;
  const filename = (
    (Array.from(stem).slice(0, 48).join("") || "file") + extension
  ).replace(/^\.+$/, "file");
  const path = `exports/${uid("FILE")}/${filename}`;
  const directory = Directory.Cache;
  try {
    const { uri } = await Filesystem.writeFile({
      path,
      directory,
      data: "",
      recursive: true,
    });
    // 分块跨越原生桥，避免将最大 200MB 附件一次扩展为 base64。
    const chunkSize = 1024 * 1024;
    for (let offset = 0; offset < blob.size; offset += chunkSize) {
      await Filesystem.appendFile({
        path,
        directory,
        data: await base64(blob.slice(offset, offset + chunkSize)),
      });
    }
    await Share.share({ files: [uri], title: name, dialogTitle: "导出文件" });
    // shortcut: 导出文件交由系统缓存回收；频繁导出大文件时增加过期清理。
    return true;
  } catch (error) {
    await Filesystem.deleteFile({ path, directory }).catch(() => {});
    if (error instanceof Error && error.message === "Share canceled") return false;
    throw error;
  }
}
