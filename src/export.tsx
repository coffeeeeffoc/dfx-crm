import { App, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useCRM } from "./context";
import { fieldKind, pageNames, scopeData } from "./access";
import { projectFields } from "./permission-ui";
import { exportRows } from "./records";
import { exportExcel } from "./storage";
import type { Page } from "./domain";
import type { AreaId } from "./access";
export function ExportRecords({
  rows,
  menu,
  region = "list",
}: {
  rows: { id: string }[];
  menu?: Page;
  region?: AreaId;
}) {
  const { rawState, access, page, change } = useCRM();
  const target = menu || page;
  const { message } = App.useApp();
  if (!access.can(target, "export", "export")) return null;
  return (
    <Button
      icon={<DownloadOutlined />}
      onClick={async () => {
        if (!access.can(target, "export", "export")) return;
        try {
          const kind = fieldKind(target);
          const ids = new Set(rows.map((r) => r.id));
          const visible = projectFields(
            scopeData(rawState, access),
            access,
            "export",
            target,
          );
          const records = (
            (projectFields(visible, access, region, target) as any)[kind] || []
          ).filter((r: any) => ids.has(r.id));
          const output = exportRows(
            records.map((r: any) => ({
              ...r,
              myTags: r.personalTags?.[access.user?.name || ""],
            })),
            rawState.admin!.fields[kind] || [],
            (key) =>
              access.field(target, region, key) !== "hidden" &&
              access.field(target, "list", key) !== "hidden" &&
              access.field(target, "export", key) !== "hidden",
          );
          if (!output.headers.length)
            return void message.warning("没有可导出的字段");
          await exportExcel(pageNames[target], output.headers, output.rows);
          change(
            "导出列表",
            `${pageNames[target]} · ${records.length} 条`,
            (s) => ({ ...s }),
            true,
          );
          message.success(`已导出 ${records.length} 条当前筛选记录`);
        } catch (e) {
          message.error(`导出失败：${(e as Error).message}`);
        }
      }}
    >
      导出筛选结果
    </Button>
  );
}
