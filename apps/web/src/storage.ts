import type { Attachment, State } from "@dfx-crm/core/domain";
import { uid } from "@dfx-crm/core/domain";
import { Capacitor } from "@capacitor/core";

export const storageKey = "xingpu-crm-prototype-v1";
export function validateState(value: unknown): value is State {
  if (!value || typeof value !== "object") return false;
  const s = value as State;
  const object = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  const strings = (v: Record<string, unknown>, keys: string[]) =>
    keys.every((key) => typeof v[key] === "string");
  const admin = s.admin;
  if (
    admin !== undefined &&
    (!object(admin) ||
      !object(admin.company) ||
      !strings(admin.company, ["name", "shortName", "logo", "tagline"]) ||
      !Array.isArray(admin.users) ||
      !admin.users.every(
        (u) =>
          object(u) &&
          strings(u, [
            "id",
            "username",
            "name",
            "roleId",
            "managerId",
            "department",
            "email",
          ]) &&
          ["active", "disabled", "deleted"].includes(u.status),
      ) ||
      !Array.isArray(admin.roles) ||
      !admin.roles.every(
        (r) =>
          object(r) &&
          strings(r, ["id", "code", "name", "description"]) &&
          Array.isArray(r.menus) &&
          object(r.grants) &&
          object(r.fields),
      ) ||
      !object(admin.fields) ||
      !Object.values(admin.fields).every(
        (fields) =>
          Array.isArray(fields) &&
          fields.every(
            (f) =>
              object(f) &&
              strings(f, ["key", "label", "type"]) &&
              typeof f.enabled === "boolean",
          ),
      ) ||
      !admin.users.some(
        (u) =>
          u.status === "active" &&
          admin.roles.some((r) => r.id === u.roleId && r.code === "sys_admin"),
      ))
  )
    return false;
  return (
    s.version === 1 &&
    ["activities", "resources"].every(
      (k) => (s as any)[k] === undefined || Array.isArray((s as any)[k]),
    ) &&
    [
      "customers",
      "leads",
      "projects",
      "communications",
      "quotes",
      "orders",
      "services",
      "inventory",
      "suppliers",
      "knowledge",
      "audit",
      "daily",
      "expenses",
    ].every((k) => Array.isArray(s[k as keyof State])) &&
    ["brands", "applications", "categories"].every((k) =>
      Array.isArray(s.dictionaries?.[k as keyof State["dictionaries"]]),
    )
  );
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("xingpu-crm-files", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("无法打开本机附件库"));
  });
}
export async function saveAttachment(file: File): Promise<Attachment> {
  if (file.size > 200 * 1024 * 1024) throw new Error("单个文件不能超过 200MB");
  if (!/\.(jpe?g|png|pdf|docx?|xlsx?|pptx?)$/i.test(file.name))
    throw new Error("支持图片、PDF、Word、Excel、PPT；视频请使用链接");
  const db = await database();
  const id = uid("FILE");
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(file, id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(new Error("附件保存失败，可能是浏览器空间不足"));
    };
    tx.onabort = () => {
      db.close();
      reject(new Error("附件保存已中断"));
    };
  });
  return { id, name: file.name, type: file.type, size: file.size };
}
export async function openAttachment(attachment: Attachment, preview = false) {
  const isPreview =
    !Capacitor.isNativePlatform() &&
    preview &&
    /\.(png|jpe?g|pdf)$/i.test(attachment.name);
  const popup = isPreview ? window.open("about:blank", "_blank") : null;
  if (popup) popup.opener = null;
  try {
    const db = await database();
    const file = await new Promise<Blob>((resolve, reject) => {
      const request = db
        .transaction("files")
        .objectStore("files")
        .get(attachment.id);
      request.onsuccess = () => {
        db.close();
        request.result
          ? resolve(request.result)
          : reject(new Error("本机附件不存在，请重新添加"));
      };
      request.onerror = () => {
        db.close();
        reject(new Error("附件读取失败"));
      };
    });
    if (isPreview && popup) {
      const url = URL.createObjectURL(file);
      popup.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else await download(file, attachment.name);
  } catch (e) {
    popup?.close();
    throw e;
  }
}
export async function download(blob: Blob, name: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const { shareNativeFile } = await import("./native-files");
    return shareNativeFile(blob, name);
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
export async function exportExcel(
  name: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  sheet.addRow(headers);
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3866DC" },
  };
  sheet.columns.forEach((column) => {
    column.width = 24;
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };
  const buffer = await workbook.xlsx.writeBuffer();
  return download(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${name}.xlsx`,
  );
}
